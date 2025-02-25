import { IBooking, IUser } from "../common";
import { ISession, ITrainer } from "../trainer_interface";

export interface ITrainerService {
    findAllSpecializations(): Promise<any>;
    registerTrainer(trainerData: ITrainer): Promise<{ email: string } | null>;
    verifyOTP(trainerData: ITrainer, otp: string): Promise<void>;
    resendOTP(email: string): Promise<void>;
    trainerLogin({ email, password }: { email: string; password: string } ): Promise<{ accessToken: string, refreshToken: string; trainer: ITrainer }>;
    generateTokn(trainer_refresh_token: string): Promise<string>;
    kycSubmit(formData: any, files: { [fieldname: string]: Express.Multer.File[] }): Promise<boolean>;
    kycStatus(trainerId: string): Promise<{ status: string }>;
    updateKycStatus(trainerId: string): Promise<any>;
    fetchTrainer(trainer_id: string): Promise<ITrainer | null>;
    findTrainer(trainer_id: string, ): Promise<ITrainer | null>;
    updateTrainer(trainer_id: string, trainerData: ITrainer):  Promise<ITrainer| null>;
    fetchSpec(trainer_id: string): Promise<ISession[]>;
    fetchRejectionData(trainer_id: string): Promise<{ reason: string } | null>;
    AddNewSession(sessionData: ISession, recurrenceOption: string): Promise<ISession | ISession[]>;
    getSessionSchedules(trainer_id: string): Promise<ISession[]>;
    deleteSession(session_id: string): Promise<boolean>;
    getBookingDetails(trainer_id: string): Promise<IBooking[]>;
    fetchUser(userId: string): Promise<IUser | null>;
    getWallet(trainer_id: string): Promise<any>;
    withdraw(trainer_id: string, amount: number): Promise<any>;
    addPrescription(bookingId: string, prescription: string): Promise<boolean>;
    getNotifications(trainerId: string): Promise<any>;
    clearNotifications(trainerId: string): Promise<any>;
    updatePrescription(bookingId: string, newPrescription: string): Promise<any>;
    getBooking(bookingId: string): Promise<IBooking>;
}


