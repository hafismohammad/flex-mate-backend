import { Request, Response, NextFunction } from "express";
// import UserService from "../services/userService";
import {IUserService} from '../../src/interface/user/User.service.interface'
import { IUser, ILoginUser } from "../interface/common";
import { uploadToCloudinary } from "../config/cloudinary";

class UserController {
  private userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: IUser = req.body;
      await this.userService.register(userData);
      res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Email already exists") {
          res.status(409).json({ message: "Email already exists" });
        } else {
          res.status(500).json({ message: "Something went wrong, please try again later" });
        }
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: ILoginUser = req.body;
      const user = await this.userService.login({ email, password });
      if (user) {
        const { accessToken, refreshToken } = user;
        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
          message: "Login successful",
          user: user.user,
          token: accessToken,
        });
      }
    } catch (error: any) {
      if (error.message === "User is blocked") {
        res.status(403).json({ message: "User is blocked" });
      } else if (error.message === "Invalid email or password") {
        res.status(401).json({ message: "Invalid email or password" });
      } else {
        next(error);
      }
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) {
      res.status(403).json({ message: "Refresh token not found" });
      return;
    }
    try {
      const newAccessToken = await this.userService.generateTokn(refresh_token);
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Error generating new access token:", error);
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction):  Promise<void> {
    try {
      const { userData, otp } = req.body;
      await this.userService.verifyOTP(userData, otp);
      res
        .status(200)
        .json({ message: "OTP verified successfully", user: userData });
    } catch (error) {
      console.error("OTP Verification Controller error:", error);
      if ((error as Error).message === "OTP has expired") {
        res.status(400).json({ message: "OTP has expired" });
      } else if ((error as Error).message === "Invalid OTP") {
        res.status(400).json({ message: "Invalid OTP" });
      } else if ((error as Error).message === "No OTP found for this email") {
        res.status(404).json({ message: "No OTP found for this email" });
      } else {
        next(error);
      }
    }
  }

  async resendOtp(
    req: Request<{ email: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      await this.userService.resendOTP(email);
      res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
      console.error("Resend OTP Controller error:", error);
      if ((error as Error).message === "User not found") {
        res.status(404).json({ message: "User not found" });
      } else {
        res;
        next(error);
      }
    }
  }

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      res.clearCookie("refresh_token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed", error });
    }
  };

  async getAllTrainers(req: Request, res: Response, next: NextFunction) {
    try {
      const allTrainers = await this.userService.fetchAllTrainers();
      res.status(200).json(allTrainers);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      next(error);
    }
  }

  async getAllSpecializations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allSpecializations = await this.userService.specializations();
      res.status(200).json(allSpecializations);
    } catch (error) {
      console.error("Error fetching specializations:", error);
      next(error);
    }
  }
  

  async getTrainer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trainerId = req.params.trainer_id;
        if (!trainerId) {
             res.status(400).json({ message: "Trainer ID is required" });
        }
        
        const trainer = await this.userService.getTrainer(trainerId);
        if (!trainer) {
             res.status(404).json({ message: "Trainer not found" });
        }
         res.status(200).json(trainer); 
    } catch (error) {
        console.error("Error in getTrainer controller:", error);
        next(error);
    }
}


  async getSessionSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionSchedules = await this.userService.getSessionSchedules();
      res.status(200).json(sessionSchedules);
    } catch (error) {
      next(error);
    }
  }

  async checkoutPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userData.id;
      const session_id = req.params.session_id;

      const  { id }  = await this.userService.checkoutPayment(
        session_id,
        userId
      );
      res.status(200).json({ id});
    } catch (error) {
      console.error("Error in checkoutPayment:", error);
      next(error);
    }
  }

  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, userId, stripe_session_id } = req.body;
      const bookingDetails = await this.userService.findBookingDetails(
        sessionId,
        userId,
        stripe_session_id
      );
      res.status(200).json(bookingDetails);
    } catch (error) {
      console.log("Error in create booking");
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.user_id;
      const userData = await this.userService.fetchUserData(userId);
      res.status(200).json(userData);
    } catch (error) {
      console.log("Error getting user data");
      next(error);
    }
  }

  async updateUserData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;
      const userId = req.body._id;
      await this.userService.updateUser(userData, userId);
      res.status(200).json({ message: "User Updated Successfully" });
    } catch (error) {
      next(error);
    }
  }

  async uploadProfileImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_id = req.params.user_id;
      if (req.file) {
        const profileImageUrl = await uploadToCloudinary(
          req.file.buffer,
          "user_profileImage"
        );
        const imgUrl = await this.userService.uploadProfileImage(
          profileImageUrl.secure_url,
          user_id
        );
        res
          .status(200)
          .json({ message: "Image uploaded successfully", imgUrl });
      } else {
        res.status(400).json({ message: "No file provided" });
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_id = req.params.user_id;
      const bookings = await this.userService.getAllBookings(user_id);
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }
  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const cancelNotification = await this.userService.cancelBooking(
        booking_id
      );
      res
        .status(200)
        .json({
          message: "Booking canceled and refund processed",
          data: cancelNotification,
        });
    } catch (error) {
      next(error);
    }
  }

  async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reviewComment, selectedRating, userId, trainerId } = req.body;
      const response = await this.userService.addReview(
        reviewComment,
        selectedRating,
        userId,
        trainerId
      );
      console.log(response);
      let reviewId = response._id;
      res
        .status(200)
        .json({ message: "Review created successfully", reviewId });
    } catch (error) {
      next(error);
    }
  }

  async editReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reviewComment, selectedRating, userReviewId } = req.body;
      const response = await this.userService.editReview(
        reviewComment,
        selectedRating,
        userReviewId
      );
      res.status(200).json({ message: "Review edited successfully" });
    } catch (error) {
      next(error);
    }
  }

  async getReivew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trainer_id } = req.params;
      const reviews = await this.userService.reviews(trainer_id);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }

  async getReivewSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trainer_id } = req.params;
      const reviewsAndAvgRating = await this.userService.getReviewSummary(
        trainer_id
      );
      res.status(200).json(reviewsAndAvgRating);
    } catch (error) {
      next(error);
    }
  }

  async findbookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_id, trainer_id } = req.params;
      const bookingStatus = await this.userService.findBookings(
        user_id,
        trainer_id
      );
      res.status(200).json(bookingStatus);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_id } = req.params;
      const notifications = await this.userService.getNotifications(user_id);
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async clearNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_id } = req.params;
      await this.userService.clearNotifications(user_id);
      res.status(200).json({ message: "Notifications cleared successfully" });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_id } = req.params;
      const { currentPassword, newPassword } = req.body;
      await this.userService.resetPassword(
        user_id,
        currentPassword,
        newPassword
      );
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
