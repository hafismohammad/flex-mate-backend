import { IBooking, ILoginUser, INotification, IReview, ISessionSchedule, IUser } from "../common";
import { ISpecialization, ITrainer } from "../trainer_interface";

export interface IUserService {
    register(userData: IUser): Promise<void>;
    verifyOTP(userData: IUser, otp: string): Promise<void>;
    resendOTP(email: string): Promise<void>;
    login(credentials: ILoginUser): Promise<{ accessToken: string; refreshToken:string; user: IUser }>;
    generateTokn(userRefreshToken: string): Promise<string>;
    fetchAllTrainers(): Promise<ITrainer[]>;
    specializations(): Promise<ISpecialization[]>;
    getTrainer(trainerId: string): Promise<ITrainer | null>;
    getSessionSchedules(): Promise<ISessionSchedule[]>;
    checkoutPayment(session_id: string, userId: string): Promise<{id:string}>;
    findBookingDetails(session_id: string, user_id: string, stripe_session_id: string): Promise<IBooking | null>;
    fetchUserData(userId: string): Promise<IUser | null>;
    updateUser(userData: IUser, userId: string): Promise<boolean>;
    uploadProfileImage(imageUrl: string, user_id: string): Promise<any>;
    getAllBookings(user_id: string): Promise<IBooking[]>;
    cancelBooking(bookingId: string): Promise<boolean>;
    addReview(reviewComment: string, selectedRating: number, userId: string, trainerId: string): Promise<{_id: string}>;
    editReview(reviewComment: string, selectedRating: number, userReviewId: string): Promise<boolean>;
    reviews(trainer_id: string): Promise<IReview[]>;
    getReviewSummary(trainer_id: string): Promise<any>;
    findBookings(user_id: string, trainerId: string): Promise<string | null>;
    getNotifications(userId: string): Promise<INotification[]>;
    clearNotifications(userId: string): Promise<void>;
    resetPassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }>;
}
