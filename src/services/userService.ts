import { IUser, ILoginUser, IBooking } from "../interface/common";
import { differenceInHours } from 'date-fns';
import {generateAccessToken, generateRefreshToken, verifyRefreshToken,} from "../utils/jwtHelper";
// import UserRepository from "../repositories/userRepository";
import {IUserRepository} from '../../src/interface/user/User.respository.interface'
import sendMail from "../config/email_config";
import bcrypt from "bcryptjs";
import stripe from "../config/stripeClient";
import mongoose from "mongoose";
import { User } from "../interface/user_interface";
import BookingModel from "../models/booking";
import { ISpecialization, ITrainer } from "../interface/trainer_interface";

class UserService {
  private userRepository: IUserRepository;
  private OTP: string | null = null;
  private expiryOTP_time: Date | null = null;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async register(userData: IUser): Promise<void> {
    try {
      const existingUser = await this.userRepository.existsUser(userData.email);
      if (existingUser) {
        console.log("User already exists");
        throw new Error("Email already exists"); 
      }
      const generatedOTP: string = Math.floor(1000 + Math.random() * 9000).toString();
      this.OTP = generatedOTP;
      console.log("Generated OTP is", this.OTP);
      const OTP_createdTime = new Date();
      this.expiryOTP_time = new Date(OTP_createdTime.getTime() + 1 * 60 * 1000);
      const isMailSent = await sendMail("otp", userData.email, this.OTP);
      if (!isMailSent) {
        throw new Error("Email not sent");
      }
      await this.userRepository.saveOTP(userData.email, this.OTP, this.expiryOTP_time);
      console.log(`OTP will expire at: ${this.expiryOTP_time}`);
    } catch (error) {
      console.error("Error in user service:", error);
      throw error; 
    }
  }
  
  async verifyOTP(userData: IUser, otp: string): Promise<void> {
    try {
      const validOtps = await this.userRepository.getOtpsByEmail(
        userData.email
      );
      if (validOtps.length === 0) {
        console.log("No OTP found for this email");
        throw new Error("No OTP found for this email");
      }
      const latestOtp = validOtps.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];
      if (latestOtp.otp === otp) {

        if (!userData.password) {
          throw new Error("Password is required for verification.");
        }

        if (latestOtp.expiresAt > new Date()) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          const newUserData = { ...userData, password: hashedPassword };
          await this.userRepository.createNewUser(newUserData);

          await this.userRepository.deleteOtpById(latestOtp._id);
        } else {
          console.log("OTP has expired");
          await this.userRepository.deleteOtpById(latestOtp._id);
          throw new Error("OTP has expired");
        }
      } else {
        throw new Error("Invalid OTP");
      }
    } catch (error) {
      const errorMessage = (error as Error).message || "An unknown error occurred";
      throw error;
    }
  }

  async resendOTP(email: string): Promise<void> {
    try {
      const generatedOTP: string = Math.floor(
        1000 + Math.random() * 9000
      ).toString();
      this.OTP = generatedOTP;
      const OTP_createdTime = new Date();
      this.expiryOTP_time = new Date(OTP_createdTime.getTime() + 1 * 60 * 1000);
      await this.userRepository.saveOTP(email, this.OTP, this.expiryOTP_time);
      const isMailSent = await sendMail('otp',email, this.OTP);

      if (!isMailSent) {
        throw new Error("Failed to resend OTP email.");
      }
      console.log(`Resent OTP ${this.OTP} to ${email}`);
    } catch (error) {
      console.error("Error in resendOTP:", (error as Error).message);
      throw error;
    }
  }

  async login({ email, password }: ILoginUser): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
    try {
      const userData: IUser | null = await this.userRepository.findUser(email);
      if (userData) {
        if (userData.isBlocked) {
          throw new Error("User is blocked");
        }
        const isPasswordMatch = await bcrypt.compare(
          password,
          userData.password || ""
        );

        if (isPasswordMatch) {
          if (!userData._id) {
            throw new Error("User ID is missing");
          }
          const accessToken = generateAccessToken({
            id: userData._id.toString(),
            email: userData.email,
            role: 'user'
          });
          const refreshToken = generateRefreshToken({
            id: userData._id.toString(),
            email: userData.email,
          });
          return {
            accessToken,
            refreshToken,
            user: {
              id: userData._id.toString(),
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              isBlocked: userData.isBlocked,
            },
          };
        }
      }
      throw new Error("Invalid email or password");
    } catch (error) {
      throw error;
    }
  }

  async generateTokn(user_refresh_token: string): Promise<string> {
    try {
      const payload = verifyRefreshToken(user_refresh_token);
      let id: string | undefined;
      let email: string | undefined;
      if (payload && typeof payload === "object") {
        id = payload?.id;
        email = payload?.email;
      }
      if (id && email) {
        const role = 'user'
        const userNewAccessToken = generateAccessToken({ id, email,role });
        return userNewAccessToken;
      } else {
        throw new Error("Invalid token payload structure");
      }
    } catch (error) {
      throw error;
    }
  }

  async fetchAllTrainers(): Promise<ITrainer[]>  {
    try {
      const trainers = await this.userRepository.fetchAllTrainers();
      const approvedTrainers = trainers?.filter((trainer: any) => 
      trainer.kycStatus === "approved" && trainer.isBlocked === false) || [];
      return approvedTrainers;
    } catch (error) {
      console.error("Error fetching trainers:", error);
      throw error;
    }
  }

  async specializations(): Promise<ISpecialization[]> {
    try {
      const data = await this.userRepository.fetchSpecializations();
      return data;
    } catch (error) {
      console.error("Error fetching specializations:", error);
      throw error;
    }
  }
  

  async getTrainer(trainerId: string): Promise<ITrainer | null> {
    try {
      return await this.userRepository.getTrainer(trainerId);
    } catch (error) {
      throw new Error("Failed to retrieve trainer details. Please try again later.");
    }
  }
  
  async getSessionSchedules(): Promise<any>  {
    try {
      return await this.userRepository.fetchAllSessionSchedules();
    } catch (error) {
      throw new Error("Failed to fetch session schedules. Please try again later.");
    }
  }
  

  async checkoutPayment(session_id: string, userId: string): Promise<{id:string}> {
    try {
      
      const sessionData = await this.userRepository.findSessionDetails(session_id);
      if (!sessionData || !sessionData.trainerId || !sessionData.price) {
        throw new Error("Missing session data, trainer ID, or price");
      }
      const trainer_id = sessionData.trainerId.toString();
      const trainerData = await this.userRepository.findTrainerDetails(trainer_id);
  
      if (!trainerData) {
        throw new Error("Trainer data not found");
      }
      const lineItems = [
        {
          price_data: {
            currency: "inr",
            unit_amount: sessionData.price * 100,
            product_data: {
              name: `Trainer Name: ${trainerData.name} - (${trainerData.specialization})`,
              description: sessionData.isSingleSession
                ? `Description: Session from ${sessionData.startTime} to ${sessionData.endTime} on ${sessionData.startDate.toLocaleDateString()}`
                : `Description: Session from ${sessionData.startTime} to ${sessionData.endTime} on ${sessionData.startDate.toLocaleDateString()} to ${sessionData.endDate.toLocaleDateString()}`,
            },
          },
          quantity: 1,
        },
      ];
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.CORS_ORIGIN}/paymentSuccess?session_id=${sessionData._id}&user_id=${userId}&stripe_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CORS_ORIGIN}/paymentFailed`,
      });
     
      
      return { id: session.id };
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      throw error;
    }
  }

  async findBookingDetails(session_id: string, user_id: string, stripe_session_id: string): Promise<IBooking | null> {
    try {
      const session = await this.userRepository.findSessionDetails(session_id);
      if (session) {
        session.status = "Confirmed";
        await session.save();
      }
      const trainerId = session?.trainerId;

      if (!trainerId) {
        throw new Error("Trainer ID is not available in the session.");
      }
      const trainer = await this.userRepository.getTrainer(trainerId);
      const sessionData = await stripe.checkout.sessions.retrieve(stripe_session_id);
  
        if (!trainer) {
          throw new Error("Trainer not found.");
        }
      const bookingDetails: IBooking = {
        sessionId: new mongoose.Types.ObjectId(session._id),
        trainerId: new mongoose.Types.ObjectId(trainer._id),
        userId: new mongoose.Types.ObjectId(user_id),
        specialization: session.specializationId.name,
        sessionType: session.isSingleSession ? "Single Session" : "Package Session",
        bookingDate: new Date(),
        startDate: session.startDate,
        endDate: session.endDate,
        startTime: session.startTime,
        endTime: session.endTime,
        amount: session.price,
        paymentStatus: "Confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
        payment_intent: sessionData.payment_intent ? sessionData.payment_intent.toString() : undefined
      };
      const existingBooking = await this.userRepository.findExistingBooking(bookingDetails);
      if (existingBooking) {
        // console.log("Booking already exists:", existingBooking);
        return existingBooking; 
      }
      const bookingData =  await this.userRepository.createBooking(bookingDetails);
      await this.userRepository.createNotification(bookingData)
      return bookingData;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw new Error("Failed to fetch booking details.");
    }
  }
  
  async fetchUserData(userId: string): Promise<IUser | null>  {
    try {
      return await this.userRepository.fetchUser(userId);
    } catch (error) {
      throw new Error("Error fetching user");
    }
  }

  async updateUser(userdata: IUser, userId: string): Promise<any>  {
    try {
      return await this.userRepository.updateUser(userdata, userId);
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }
  async uploadProfileImage(imagUrl: string, user_id: string): Promise<any> {
    try {
      return await this.userRepository.uploadPfileImage(imagUrl, user_id);
    } catch (error) {
      console.log(error);
    }
  }

  async getAllBookings(user_id: string): Promise<IBooking[]>  {
    try {
      return await this.userRepository.fetchBookings(user_id);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return []; 
    }
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      // Fetch the booking, ensuring it is a Mongoose document
      const bookingData = await this.userRepository.fetchBooking(bookingId);
  
      if (!bookingData) throw new Error("Booking not found");
  
      // Wrap the booking data into a Mongoose document (if necessary)
      const bookingDoc = new BookingModel(bookingData);
  
      if (bookingDoc.paymentStatus !== 'Confirmed') {
        throw new Error("Booking is not confirmed or has already been canceled");
      }
  
      if (typeof bookingDoc.amount !== 'number') {
        throw new Error("Booking amount is undefined or invalid");
      }
  
      const sessionStartDate = new Date(bookingDoc.startDate);
      const hoursLeft = differenceInHours(sessionStartDate, new Date());
      let refundPercentage = 0;
  
      if (hoursLeft > 24) {
        refundPercentage = 1; // 100% refund
      } else if (hoursLeft > 6) {
        refundPercentage = 0.5; // 50% refund
      } else {
        refundPercentage = 0; // No refund
      }
  
      if (refundPercentage === 0) {
        bookingDoc.paymentStatus = 'Cancelled';
        await bookingDoc.save();  // Save the Mongoose document
        return true;
      }
  
      const refundAmount = Math.floor(bookingDoc.amount * refundPercentage);
  
      const refund = await stripe.refunds.create({
        payment_intent: bookingDoc.payment_intent,
        amount: refundAmount,
      });
  
      if (refund.status === 'succeeded') {
        bookingDoc.paymentStatus = 'Cancelled';
        await bookingDoc.save();  // Save the Mongoose document after successful refund
      } else {
        throw new Error("Refund failed or is incomplete");
      }
  
      // Call the repository method to create a cancel notification
      const cancelNotification = await this.userRepository.cancelNotification(bookingDoc);
  
      return cancelNotification;
    } catch (error) {
      console.error("Error in cancelBooking service:", error);
      throw error;
    }
  }
  
  async addReview(reviewComment: string, selectedRating: number, userId: string, trainerId: string): Promise< {_id: string}>  {
    try {
      return await this.userRepository.createReview(reviewComment, selectedRating, userId, trainerId)
    } catch (error) {
      throw new Error('Failed to create review');
    }
  }

  async editReview(reviewComment: string, selectedRating: number,userReviewId: string): Promise<boolean>  {
    try {
      return await this.userRepository.editReview(reviewComment, selectedRating, userReviewId)
    } catch (error) {
      throw new Error('Failed to create review');
    }
  }

  async reviews(trainer_id: string): Promise<any[]>  {
    try {
      return await this.userRepository.getReview(trainer_id)
    } catch (error) {
      throw new Error('failed to find review')    
    }
  }

  async getReviewSummary(trainer_id: string): Promise<any> {
    try {      
      const avgReviewsRating = await this.userRepository.getAvgReviewsRating(trainer_id)
      return avgReviewsRating
    } catch (error) {
      throw new Error('failed to find review summary')   
    }
  }
 
 async findBookings(user_id: string, trainerId: string): Promise<string | null> {
  try {
    const bookingData = await this.userRepository.findBookings(user_id, trainerId)
    return bookingData?.paymentStatus ?? null; 
  } catch (error) {
    throw new Error('failed to find booking') 
  }
 }

 async getNotifications(userId: string): Promise<any>  {
  try {
    return await this.userRepository.fetchNotifications(userId)
  } catch (error) {
    throw new Error('failed to find notifications')
  }
 }

 async clearNotifications(userId: string): Promise<void> {
  try {
    return await this.userRepository.deleteUserNotifications(userId)
  } catch (error) {
    throw new Error('failed to delete notifications')
  }
 }
 
 async resetPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  try {
    // Specify the Mongoose document type
    const userData = await this.userRepository.fetchUser(userId) as mongoose.Document & IUser;

    if (!userData?.password) {
      throw new Error("User password is null");
    }

    const isPasswordMatch = await bcrypt.compare(currentPassword, userData.password);

    if (!isPasswordMatch) {
      throw new Error("Old password is not correct");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userData.password = hashedPassword;

    // Save changes using the Mongoose `save` method
    await userData.save();
    return { message: "Password reset successfully" };
  } catch (error) {
    console.error("Failed to reset password:", error);
    throw new Error("Failed to reset password");
  }
}
}

export default UserService;
