import { IBooking, IOtp, IUser } from "../common";
import { ISession, ITrainer } from "../trainer_interface";

export interface ITrainerRepository {
    findAllSpecializations(): Promise<any>;
    existsTrainer(email: string): Promise<ITrainer | null>;
    saveOTP(email: string, OTP: string, OTPExpiry: Date): Promise<void>;
    getOtpsByEmail(email: string): Promise<IOtp[]>;
    findTrainerSpecializations(specializationNames: any): Promise<any>;
    createNewTrainer(trainerData: ITrainer): Promise<void>;
    deleteOtpById(otpId?: string): Promise<void>;
    findTrainer(email: string): Promise<ITrainer | null>;
    getOldImages(trainerId: string): Promise<any>;
    saveKyc(formData: any, documents: any): Promise<any>;
    getTrainerStatus(trainerId: string): Promise<string>;
    changeKycStatus(trainerId: string, profileImage?: string): Promise<string | undefined>;
    updateKycStatus(trainerId: string): Promise<any>;
    fetchTrainer(trainer_id: string): Promise<ITrainer | null>;
    getTrainerProfile(trainer_id: string): Promise<string | undefined>;
    updateTrainerData(trainer_id: string): Promise<any>;
    fetchSpec(traienr_id: string): Promise<ISession[]>;
    fetchRejectionData(trainerId: string): Promise<{ reason: string } | null>;
    createMultipleSessions(sessions: ISession[]): Promise<ISession[]>;
    createNewSession(sessionData: ISession): Promise<ISession>;
    fetchSessionData(trainer_id: string): Promise<ISession[]>;
    deleteSession(session_id: string): Promise<boolean>;
    fetchBookingDetails(trainer_id: string): Promise<IBooking[]>;
    fetchUeserDetails(userId: string): Promise<IUser | null>;
    getSession(sessionId: string): Promise<ISession | null>;
    updateSessionData(sessionId: string, sessionCount: number): Promise<ISession>;
    updateSessionStatus(bookingId: string): Promise<any>;
    fetchWalletData(trainer_id: string): Promise<any>;
    withdrawMoney(trainer_id: string, amount: number): Promise<any>;
    addPrescription(bookingId: string, prescriptions: string): Promise<any>;
    fetchNotifications(trainerId: string): Promise<any>;
    deleteTrainerNotifications(trainerId: string): Promise<void>;
    updatePrescriptionContect(bookingId: string, newPrescription: string): Promise<void>;
    fetchUserBooking(bookingId: string): Promise<any>;
    // static async getIsBlockedTrainer(trainer_id: string): Promise<boolean>;
  }
  