import { IUser, IOtp, IBooking, ISessionSchedule } from "../common";
import mongoose from "mongoose";
import { User } from "../user_interface";
import { ISpecialization, ITrainer } from "../trainer_interface";

export interface IUserRepository {
  existsUser(email: string): Promise<IUser | null>;
  saveOTP(email: string, OTP: string, OTPExpiry: Date): Promise<void>;
  getOtpsByEmail(email: string): Promise<IOtp[]>;
  createNewUser(userData: IUser): Promise<void>;
  deleteOtpById(otpId?: mongoose.Types.ObjectId): Promise<void>;
  findUser(email: string): Promise<IUser | null>;
  fetchAllTrainers(): Promise<ITrainer[]>;
  fetchSpecializations(): Promise<ISpecialization[]>;
  getTrainer(trainerId: string): Promise<ITrainer | null>;
  fetchAllSessionSchedules(): Promise<ISessionSchedule[]>;
  deleteExpiredUnbookedSessions(currentDate: Date): Promise<number>;
  findSessionDetails(sessionId: string): Promise<any | null>;
  findTrainerDetails(trainerId: string): Promise<any | null>;
  findExistingBooking(bookingDetails: IBooking): Promise<IBooking | null>;
  createBooking(bookingDetails: IBooking): Promise<IBooking>;
  createNotification(bookingDetails: IBooking): Promise<void>;
  fetchUser(userId: string): Promise<IUser | null>;
  updateUser(userdata: IUser, userId: string): Promise<IUser | null>;
  uploadPfileImage(imagUrl: string, userId: string): Promise<any | null>;
  fetchBookings(userId: string): Promise<any[]>;
  fetchBooking(bookingId: string): Promise<IBooking | null>;
  cancelNotification(bookingDetails: IBooking): Promise<any>;
  createReview(reviewComment: string,selectedRating: number,userId: string,trainerId: string): Promise<any>;
  editReview(reviewComment: string,selectedRating: number,userReviewId: string): Promise<any>;
  getReview(trainerId: string): Promise<any[]>;
  getAvgReviewsRating(trainerId: string): Promise<any[]>;
  findBookings(userId: string, trainerId: string): Promise<IBooking | null>;
  fetchNotifications(userId: string): Promise<any>;
  deleteUserNotifications(userId: string): Promise<void>;
}
