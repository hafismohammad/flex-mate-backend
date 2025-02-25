import {IUser,IOtp,IBooking,INotificationContent,INotification,} from "../interface/common";
import UserModel from "../models/userModel";
import OtpModel from "../models/otpModel";
import mongoose from "mongoose";
import TrainerModel from "../models/trainerModel";
import SpecializationModel from "../models/specializationModel";
import SessionModel from "../models/sessionModel";
import BookingModel from "../models/booking";
import { User } from "../interface/user_interface";
import { ISpecialization, ITrainer } from "../interface/trainer_interface";
import ReviewModel from "../models/reviewMolel";
import NotificationModel from "../models/notificationModel";
import { IUserRepository } from "../interface/user/User.respository.interface";

class UserRepository implements IUserRepository {
  private userModel = UserModel;
  private otpModel = OtpModel;
  private trainerModel = TrainerModel;
  private specializationModel = SpecializationModel;
  private sessionModel = SessionModel;
  private bookingModel = BookingModel;
  private reviewModel = ReviewModel;
  private notificationModel = NotificationModel;

  async existsUser(email: string): Promise<IUser | null> {
    try {
      return await this.userModel.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  async saveOTP(email: string, OTP: string, OTPExpiry: Date): Promise<void> {
    try {
      const newOtp = new this.otpModel({
        email,
        otp: OTP,
        expiresAt: OTPExpiry,
      });
      await newOtp.save();
    } catch (error) {
      console.error("Error in saveOTP:", error);
      throw error;
    }
  }

  async getOtpsByEmail(email: string): Promise<IOtp[]> {
    try {
      return await this.otpModel.find({ email });
    } catch (error) {
      console.error("Error in getOtpsByEmail:", error);
      throw error;
    }
  }

  async createNewUser(userData: IUser): Promise<void> {
    try {
      await this.userModel.create(userData);
      console.log("User created successfully.");
    } catch (error) {
      console.error("Error in creating User:", error);
      throw error;
    }
  }

  async deleteOtpById(otpId: mongoose.Types.ObjectId): Promise<void> {
    try {
      if (!otpId) {
        throw new Error("OTP ID is undefined");
      }
      await this.otpModel.findByIdAndDelete(otpId.toString());
      console.log(`OTP with ID ${otpId} deleted successfully.`);
    } catch (error) {
      console.error("Error in deleting OTP:", error);
      throw error;
    }
  }

  async findUser(email: string): Promise<IUser | null> {
    try {
      return await this.userModel.findOne({ email });
    } catch (error) {
      console.log("Error finding user:", error);
      return null;
    }
  }

  async fetchAllTrainers(): Promise<ITrainer[]> {
    try {
      const trainers = await this.trainerModel
        .find({})
        .populate("specializations");
      return trainers;
    } catch (error) {
      throw error;
    }
  }

 async fetchSpecializations(): Promise<ISpecialization[]> {
  try {
    const data = await this.specializationModel.find({}).lean();
    return data;
  } catch (error) {
    console.error("Error fetching specializations from the database:", error);
    throw error;
  }
}


async getTrainer(trainerId: string): Promise<ITrainer | null> {
  try {
    return await this.trainerModel.findOne({ _id: trainerId }).populate("specializations");
  } catch (error) {
    console.error("Error fetching trainer:", error);
    return null;
  }
}


  async fetchAllSessionSchedules(): Promise<any>  {
    try {
      const schedules = await this.sessionModel
        .find({})
        .populate("specializationId");
      return schedules;
    } catch (error) {}
  }

  async deleteExpiredUnbookedSessions(currentDate: Date): Promise<number> {
    const result = await this.sessionModel.deleteMany({
      startDate: { $lt: currentDate },
      status: "Pending",
    });
    return result.deletedCount || 0;
  }

  async findSessionDetails(session_id: string): Promise<any | null>  {
    return await this.sessionModel
      .findById(session_id)
      .populate<{ specializationId: ISpecialization }>("specializationId");
  }

  async findTrainerDetails(trainer_id: string): Promise<any | null> {
    const trainerData = await this.trainerModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(trainer_id) } },
      {
        $lookup: {
          from: "specializations",
          localField: "specializations",
          foreignField: "_id",
          as: "specializationData",
        },
      },
      {
        $unwind: {
          path: "$specializationData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          specialization: "$specializationData.name",
          kycStatus: 1,
          isBlocked: 1,
          createdAt: 1,
          updatedAt: 1,
          profileImage: 1,
          gender: 1,
          language: 1,
          yearsOfExperience: 1,
          dailySessionLimit: 1,
        },
      },
    ]);
    return trainerData[0];
  }

  static async getIsBlockedUser(user_id: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(user_id);
      return user?.isBlocked ?? false;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch user's blocked status: ${error.message}`
      );
    }
  }

  async findExistingBooking(bookingDetails: IBooking): Promise<IBooking | null> {
    try {
      const existingBooking = await this.bookingModel.findOne({
        sessionId: bookingDetails.sessionId,
        userId: bookingDetails.userId,
      });
      await this.sessionModel.findByIdAndUpdate(
        { _id: bookingDetails.sessionId },
        { isBooked: true },
        { new: true }
      );
      return existingBooking;
    } catch (error) {
      throw new Error("Failed to find existing booking.");
    }
  }

  async createBooking(bookingDetails: IBooking): Promise<IBooking>  {
    try {
      const newBooking = await this.bookingModel.create(bookingDetails);
      return newBooking;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw new Error("Failed to create booking.");
    }
  }

  async createNotification(bookingDetails: IBooking): Promise<void> {
    try {
      if (!bookingDetails.trainerId || !bookingDetails.userId) {
        throw new Error("Trainer ID or User ID is missing.");
      }
      const trainerNotificationContent: INotificationContent = {
        content: `New booking for ${bookingDetails.sessionType} (${
          bookingDetails.specialization
        }) on ${bookingDetails.startDate.toDateString()} at ${
          bookingDetails.startTime
        }. Amount: $${bookingDetails.amount}.`,
        bookingId: new mongoose.Types.ObjectId(bookingDetails.sessionId),
        read: false,
        createdAt: new Date(),
      };
      const userNotificationContent: INotificationContent = {
        content: `Your ${bookingDetails.sessionType} (${
          bookingDetails.specialization
        }) on ${bookingDetails.startDate.toDateString()} at ${
          bookingDetails.startTime
        } is confirmed. Amount: $${bookingDetails.amount}.`,
        bookingId: new mongoose.Types.ObjectId(bookingDetails.sessionId),
        read: false,
        createdAt: new Date(),
      };
      const existingTrainerNotification = await this.notificationModel.findOne({
        receiverId: bookingDetails.trainerId,
      });

      if (existingTrainerNotification) {
        existingTrainerNotification.notifications.push(
          trainerNotificationContent
        );
        await existingTrainerNotification.save();
      } else {
        const newTrainerNotification: INotification = {
          receiverId: bookingDetails.trainerId,
          notifications: [trainerNotificationContent],
        };
        await this.notificationModel.create(newTrainerNotification);
      }
      const existingUserNotification = await this.notificationModel.findOne({
        receiverId: bookingDetails.userId,
      });

      if (existingUserNotification) {
        existingUserNotification.notifications.push(userNotificationContent);
        await existingUserNotification.save();
      } else {
        const newUserNotification: INotification = {
          receiverId: bookingDetails.userId,
          notifications: [userNotificationContent],
        };
        await this.notificationModel.create(newUserNotification);
      }
    } catch (error: any) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification.");
    }
  }

  async fetchUser(userId: string): Promise<IUser | null> {
    try {
      const userData = await this.userModel.findById(userId);
      return userData;
    } catch (error) {
      throw new Error("Error fetching user");
    }
  }

  async updateUser(userdata: IUser, userId: string): Promise<IUser | null> {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        { _id: userId },
        { $set: userdata },
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async uploadPfileImage(imagUrl: string, user_id: string): Promise<any>  {
    try {
      const profileImageUpdate = await this.userModel.findByIdAndUpdate(
        { _id: user_id },
        { image: imagUrl }
      );
      return profileImageUpdate;
    } catch (error) {}
  }

  async fetchBookings(user_id: string): Promise<IBooking[]> {
    const allBookings = await this.bookingModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user_id) } },
      {
        $lookup: {
          from: "trainers",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerDetails",
        },
      },
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "sessionDetails",
        },
      },
      {
        $unwind: {
          path: "$trainerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$sessionDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          trainerId: "$trainerDetails._id",
          userId: "$userId",
          trainerImage: "$trainerDetails.profileImage",
          trainerName: "$trainerDetails.name",
          trainerEmail: "$trainerDetails.email",
          specialization: "$specialization",
          sessionDates: {
            $cond: {
              if: { $eq: ["$sessionDetails.isSingleSession", true] },
              then: {
                startDate: { $ifNull: ["$sessionDetails.startDate", null] },
              },
              else: {
                startDate: { $ifNull: ["$sessionDetails.startDate", null] },
                endDate: { $ifNull: ["$sessionDetails.endDate", null] },
              },
            },
          },
          startTime: "$startTime",
          endTime: "$endTime",
          sessionType: "$sessionType",
          bookingStatus: "$paymentStatus",
          bookingDate: "$bookingDate",
          amount: "$amount",
          prescription: "$prescription",
        },
      },
      {
        $sort: {
          bookingDate: -1,
        },
      },
    ]);

    return allBookings;
  }

  async fetchBooking(bookingId: string): Promise<IBooking | null> {
    try {
      const bookingData = await this.bookingModel.findById(bookingId);
      return bookingData;
    } catch (error) {
      console.error("Error fetching booking:", error);
      throw error;
    }
  }

  async cancelNotification(bookingDetails: IBooking): Promise<{ trainerNotification: INotification; userNotification: INotification }> {
    if (!bookingDetails.trainerId || !bookingDetails.userId) {
      throw new Error("Trainer ID or User ID is missing.");
    }
    const trainerNotificationContent: INotificationContent = {
      content: `Booking for ${bookingDetails.sessionType} (${
        bookingDetails.specialization
      }) on ${new Date(bookingDetails.startDate).toDateString()} at ${
        bookingDetails.startTime
      } has been cancelled.`,
      bookingId: new mongoose.Types.ObjectId(bookingDetails.sessionId),
      read: false,
      createdAt: new Date(),
    };
    const userNotificationContent: INotificationContent = {
      content: `Your booking for ${bookingDetails.sessionType} (${
        bookingDetails.specialization
      }) on ${new Date(bookingDetails.startDate).toDateString()} at ${
        bookingDetails.startTime
      } has been cancelled.`,
      bookingId: new mongoose.Types.ObjectId(bookingDetails.sessionId),
      read: false,
      createdAt: new Date(),
    };
    let trainerNotification, userNotification;
    const existingTrainerNotification = await this.notificationModel.findOne({
      receiverId: bookingDetails.trainerId,
    });

    if (existingTrainerNotification) {
      existingTrainerNotification.notifications.push(
        trainerNotificationContent
      );
      trainerNotification = await existingTrainerNotification.save();
    } else {
      const newTrainerNotification: INotification = {
        receiverId: bookingDetails.trainerId,
        notifications: [trainerNotificationContent],
      };
      trainerNotification = await this.notificationModel.create(
        newTrainerNotification
      );
    }
    const existingUserNotification = await this.notificationModel.findOne({
      receiverId: bookingDetails.userId,
    });

    if (existingUserNotification) {
      existingUserNotification.notifications.push(userNotificationContent);
      userNotification = await existingUserNotification.save();
    } else {
      const newUserNotification: INotification = {
        receiverId: bookingDetails.userId,
        notifications: [userNotificationContent],
      };
      userNotification = await this.notificationModel.create(
        newUserNotification
      );
    }
    const data = {
      trainerNotification,
      userNotification,
    };
    return data;
  }

  async createReview(
    reviewComment: string,
    selectedRating: number,
    userId: string,
    trainerId: string
  ): Promise<any> {
    try {
      const data = {
        userId: new mongoose.Types.ObjectId(userId),
        trainerId: new mongoose.Types.ObjectId(trainerId),
        rating: selectedRating,
        comment: reviewComment,
      };
      const addReview = await this.reviewModel.create(data);
      return addReview;
    } catch (error) {
      console.error("Error creating review:", error);
      throw new Error("Failed to create review");
    }
  }

  async editReview(
    reviewComment: string,
    selectedRating: number,
    userReviewId: string
  ): Promise<any> {
    try {
      const review = await this.reviewModel.findByIdAndUpdate(
        userReviewId,
        { comment: reviewComment, rating: selectedRating },
        { new: true }
      );
    } catch (error) {
      console.error("Error creating review:", error);
      throw new Error("Failed to create review");
    }
  }

  async getReview(trainer_id: string): Promise<any[]>  {
    try {
      const reviews = await this.reviewModel.aggregate([
        {
          $match: { trainerId: new mongoose.Types.ObjectId(trainer_id) },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
          },
        },
        {
          $project: {
            review_id: "$_id",
            comment: "$comment",
            rating: "$rating",
            userName: "$userDetails.name",
            userImage: "$userDetails.image",
            userId: "$userDetails._id",
            createdAt: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      return reviews;
    } catch (error) {
      throw new Error("Failed to find review");
    }
  }

  async getAvgReviewsRating(trainer_id: string): Promise<any>  {
    try {
      const avgRatingAndReivews = await this.reviewModel.aggregate([
        {
          $match: { trainerId: new mongoose.Types.ObjectId(trainer_id) }, // Match reviews for the specific trainer
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            averageRating: { $floor: "$averageRating" },
            totalReviews: 1,
          },
        },
      ]);

      return avgRatingAndReivews;
    } catch (error) {
      console.error("Error finding review avg summary:", error);
      throw new Error("Failed to find review avg summary");
    }
  }

  async findBookings(user_id: string, trainer_id: string): Promise<IBooking | null> {
    try {
      const bookingData = await this.bookingModel.findOne({
        userId: user_id,
        trainerId: trainer_id,
        paymentStatus: "Completed",
      });

      return bookingData;
    } catch (error) {
      throw new Error("Failed to find bookings");
    }
  }

  async fetchNotifications(userId: string): Promise<any> {
    try {
      const notificationsDoc = await this.notificationModel.findOne({
        receiverId: userId,
      });

      if (notificationsDoc?.notifications?.length) {
        notificationsDoc.notifications.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return notificationsDoc;
    } catch (error) {
      throw new Error("Failed to find notifications");
    }
  }

  async deleteUserNotifications(userId: string): Promise<any> {
    try {
      await this.notificationModel.deleteOne({ receiverId: userId });
    } catch (error) {
      throw new Error("Failed to delete notifications");
    }
  }
}

export default UserRepository;
