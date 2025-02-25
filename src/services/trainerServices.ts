// trainerServices.ts
// import TrainerRepository from "../repositories/trainerRepository";
import {ITrainerRepository} from '../../src/interface/trainer/Trainer.repository.interface'
import { ITrainer } from "../interface/trainer_interface";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken,} from "../utils/jwtHelper";
import sendOTPmail from "../config/email_config";
import bcrypt from "bcryptjs";
import { ISession } from "../interface/trainer_interface";
import { createRecurringSessions } from "../utils/slotHelper";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary";
import { differenceInMinutes } from 'date-fns';
import moment from "moment";
import { IBooking, IUser } from '../interface/common';

class TrainerService {
  private trainerRepository: ITrainerRepository;
  private OTP: string | null = null;
  private expiryOTP_time: Date | null = null;

  constructor(trainerRepository: ITrainerRepository) {
    this.trainerRepository = trainerRepository;
  }

  async findAllSpecializations(): Promise<any[]>  {
    try {
      return await this.trainerRepository.findAllSpecializations();
    } catch (error) {
      console.error("Error in service while fetching specializations:", error);
      throw error;
    }
  }

  async registerTrainer(trainerData: ITrainer): Promise<{ email: string } | null> {
    try {
      const existingTrainer = await this.trainerRepository.existsTrainer(
        trainerData.email
      );
      if (existingTrainer) {
        return null;
      }
      const generatedOTP: string = Math.floor(
        1000 + Math.random() * 9000
      ).toString();
      this.OTP = generatedOTP;
      console.log("Generated OTP is", this.OTP);
      const OTP_createdTime = new Date();
      this.expiryOTP_time = new Date(OTP_createdTime.getTime() + 1 * 60 * 1000);
      console.log(`OTP will expire at: ${this.expiryOTP_time}`);
      const isMailSent = await sendOTPmail('otp',trainerData.email, this.OTP);
      if (!isMailSent) {
        throw new Error("Email not sent");
      }
      await this.trainerRepository.saveOTP(trainerData.email,this.OTP,this.expiryOTP_time);
      return { email: trainerData.email };
    } catch (error) {
      console.error("Error in service:", (error as Error).message);
      throw new Error("Error in Trainer service");
    }
  }

async verifyOTP(trainerData: ITrainer, otp: string): Promise<void> {
  try {
    const validOtps = await this.trainerRepository.getOtpsByEmail(
      trainerData.email
    );
    if (validOtps.length === 0) {
      console.log("No OTP found for this email");
      throw new Error("No OTP found for this email");
    }
    const latestOtp = validOtps.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    
    // Convert ObjectId to string if it's an ObjectId
    const otpId = typeof latestOtp._id === 'object' ? latestOtp._id.toString() : latestOtp._id;

    if (latestOtp.otp === otp) {
      if (latestOtp.expiresAt > new Date()) {
        console.log("OTP is valid and verified", latestOtp.expiresAt);
        const specializationIds = await this.trainerRepository.findTrainerSpecializations(
          trainerData.specializations 
        );
        if (!specializationIds || specializationIds.length !== trainerData.specializations.length) {
          throw new Error("One or more specializations not found");
        }
        const hashedPassword = await bcrypt.hash(trainerData.password, 10);
        const newTrainerData: ITrainer = {
          ...trainerData,
          password: hashedPassword,
          specializations: specializationIds, 
        };
        await this.trainerRepository.createNewTrainer(newTrainerData);
        await this.trainerRepository.deleteOtpById(otpId as string);
      } else {
        console.log("OTP has expired");
        await this.trainerRepository.deleteOtpById(otpId as string);
        throw new Error("OTP has expired");
      }
    } else {
      console.log("Invalid OTP");
      throw new Error("Invalid OTP");
    }
  } catch (error) {
    const errorMessage = (error as Error).message || "An unknown error occurred";
    console.error("Error in OTP verification:", errorMessage);
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
      await this.trainerRepository.saveOTP(
        email,
        this.OTP,
        this.expiryOTP_time
      );
      console.log(`Resent OTP ${this.OTP} to ${email}`);
    } catch (error) {
      console.error("Error in resendOTP:", (error as Error).message);
      throw error;
    }
  }

  async trainerLogin({ email, password }: { email: string; password: string }): Promise<any> {
    try {
      const trainerData = await this.trainerRepository.findTrainer(email);
      if (trainerData && trainerData._id) {
        const isPasswordValid = await bcrypt.compare(
          password,
          trainerData.password
        );
        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }
        if (trainerData?.isBlocked) {
          throw new Error("Trainer is blocked");
        }
        const accessToken = generateAccessToken({
          id: trainerData._id.toString(),
          email: trainerData.email,
          role: 'trainer'
        });
        const refreshToken = generateRefreshToken({
          id: trainerData._id.toString(),
          email: trainerData.email,
        });
        // console.log(accessToken, refreshToken);
        
        return {
          accessToken,
          refreshToken,
          trainer: {
            id: trainerData._id.toString(),
            email: trainerData.email,
            phone: trainerData.phone,
            specialization: trainerData.specializations,
          },
        };
      } else {
        throw new Error("Trainer not exists");
      }
    } catch (error) {
      console.error("Error in trainer login:", error);
      throw error;
    }
  }

  async generateTokn(trainer_refresh_token: string): Promise<string> {
    try {
      const payload = verifyRefreshToken(trainer_refresh_token);

      let id: string | undefined;
      let email: string | undefined;

      if (payload && typeof payload === "object") {
        id = payload?.id;
        email = payload?.email;
      }
      if (id && email) {
        const role = 'trainer'
        const TrainerNewAccessToken = generateAccessToken({ id, email, role });
        return TrainerNewAccessToken;
      } else {
        throw new Error("Invalid token payload structure");
      }
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }

  async kycSubmit(formData: any, files: { [fieldname: string]: Express.Multer.File[] }): Promise<any> {
    try {
      const documents: { [key: string]: string | undefined } = {};
      const kycData = await this.trainerRepository.getOldImages(formData.trainer_id)
      if (kycData) {
        if (kycData.aadhaarFrontImage) await deleteFromCloudinary(kycData.aadhaarFrontImage);
        if (kycData.aadhaarBackImage) await deleteFromCloudinary(kycData.aadhaarBackImage);
        if (kycData.certificate) await deleteFromCloudinary(kycData.certificate);
      }

      if (files.profileImage?.[0]) {
        const profileImageUrl = await uploadToCloudinary(
          files.profileImage[0].buffer,
          "trainer_profileImage"
        );
        documents.profileImageUrl = profileImageUrl.secure_url;
      }
  
      if (files.aadhaarFrontSide?.[0]) {
        const aadhaarFrontSideUrl = await uploadToCloudinary(
          files.aadhaarFrontSide[0].buffer,
          "trainer_aadhaarFrontSide"
        );
        documents.aadhaarFrontSideUrl = aadhaarFrontSideUrl.secure_url;
      }
  
      if (files.aadhaarBackSide?.[0]) {
        const aadhaarBackSideUrl = await uploadToCloudinary(
          files.aadhaarBackSide[0].buffer,
          "trainer_aadhaarBackSide"
        );
        documents.aadhaarBackSideUrl = aadhaarBackSideUrl.secure_url;
      }
  
      if (files.certificate?.[0]) {
        const certificateUrl = await uploadToCloudinary(
          files.certificate[0].buffer,
          "trainer_certificate"
        );
        documents.certificateUrl = certificateUrl.secure_url;
      }
       await this.trainerRepository.saveKyc(formData, documents);

      return await this.trainerRepository.changeKycStatus(
        formData.trainer_id,
        documents.profileImageUrl
      );
    } catch (error) {
      console.error("Error in kycSubmit service:", error);
      throw new Error("Failed to submit KYC data");
    }
  }
  
  async kycStatus(trainerId: string): Promise<any>  {
    try {
      const kycStatus = await this.trainerRepository.getTrainerStatus(
        trainerId
      );
      return kycStatus;
    } catch (error) {
      console.error("Error in kycStatus service:", error);
      throw new Error("Failed to retrieve KYC status");
    }
  }

  async updateKycStatus(trainerId: string): Promise<any>  {
    return await this.trainerRepository.updateKycStatus(trainerId);
  }
  async findTrainer(trainer_id: string): Promise<ITrainer | null>  {
    try {
      return await this.trainerRepository.fetchTrainer(trainer_id);
    } catch (error: any) {
      throw Error(error);
    }
  }

  async fetchTrainer(trainer_id: string): Promise<any> {
    return await this.trainerRepository.getTrainerProfile(trainer_id)
  }

  async updateTrainer(trainer_id: string, trainerData: Partial<ITrainer>) {
    try {
      const {
        profileImage,
        name,
        email,
        phone,
        yearsOfExperience,
        gender,
        language,
        dailySessionLimit,
        about,
        specializations
      } = trainerData;

      const existingTrainer = await this.trainerRepository.updateTrainerData(
        trainer_id
      );
      if (!existingTrainer) {
        throw new Error("Trainer not found");
      }
      if (profileImage) existingTrainer.profileImage = profileImage;
      if (name) existingTrainer.name = name;
      if (email) existingTrainer.email = email;
      if (phone) existingTrainer.phone = phone;
      if (yearsOfExperience)
        existingTrainer.yearsOfExperience = yearsOfExperience;
      if (gender) existingTrainer.gender = gender;
      if (language) existingTrainer.language = language;
      if (about) existingTrainer.about = about;
      if (dailySessionLimit)
        existingTrainer.dailySessionLimit = dailySessionLimit;

      if(Array.isArray(specializations)) {
        existingTrainer.specializations = specializations
      }
      await existingTrainer.save();
      return existingTrainer;
    } catch (error) {
      console.error("Error in service layer:", error);
      throw new Error("Failed to update trainer");
    }
  }

  async fetchSpec(trainer_id: string): Promise<ISession[]>  {
    return this.trainerRepository.fetchSpec(trainer_id)
  }

  async fetchRejectionData(trainer_id: string) {
    try {
      return await this.trainerRepository.fetchRejectionData(trainer_id);
    } catch (error) {
      throw new Error("Error in fetching rejectin reason");
    }
  }

  async AddNewSession(sessionData: ISession, recurrenceOption: string): Promise<ISession | ISession[]>  {
    try {
      const startTimeInput = sessionData.startTime;
      const endTimeInput = sessionData.endTime;
      const startTime = new Date(`1970-01-01T${startTimeInput}`);
      const endTime = new Date(`1970-01-01T${endTimeInput}`);

      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }
      const MINIMUM_SESSION_DURATION = 30;
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (duration < MINIMUM_SESSION_DURATION) {
        throw new Error("Session duration must be at least 30 minutes");
      }
      if (recurrenceOption === 'oneWeek' || recurrenceOption === 'twoWeek') {
        const recurringSessions = await createRecurringSessions(sessionData.startDate, recurrenceOption, sessionData);
       
        return await this.trainerRepository.createMultipleSessions(recurringSessions);
      } else {
        return await this.trainerRepository.createNewSession(sessionData);
      }
    } catch (error: any) {
      if (error.message.includes("Daily session limit")) {
        throw new Error(error.message);
      } else if (error.message === "Time conflict with an existing session.") {
        throw new Error("Time conflict with an existing session.");
      } else if (error.message === "End time must be after start time") {
        throw new Error("End time must be after start time");
      } else if (
        error.message === "Session duration must be at least 30 minutes"
      ) {
        throw new Error("Session duration must be at least 30 minutes");
      } else {
        throw new Error("Error creating new session");
      }
    }
  }

  async getSessionSchedules(trainer_id: string): Promise<ISession[]>  {
    try {
      return await this.trainerRepository.fetchSessionData(trainer_id)
    } catch (error) {
      throw new Error("Error getting sessin shedule data");
    }
  }

  async deleteSession(session_id: string): Promise<boolean>  {
    try {
      return await this.trainerRepository.deleteSession(session_id);
    } catch (error) {
      throw error;
    }
  }

  async getBookingDetails(trainer_id: string): Promise<IBooking[]>  {
    try {
      return await this.trainerRepository.fetchBookingDetails(trainer_id);
    } catch (error) {
      throw error;
    }
  }

  async fetchUser(userId: string): Promise<IUser |null> {
    return await this.trainerRepository.fetchUeserDetails(userId)
  }
  
  async getWallet(trainer_id: string): Promise<any>  {
    return await this.trainerRepository.fetchWalletData(trainer_id)
  }

  async withdraw (trainer_id:string, amount: number) : Promise<boolean>  {
    try {
      return await this.trainerRepository.withdrawMoney(trainer_id, amount)
    } catch (error: any) {
      throw Error(error)
    }
  }

  async addPrescription(bookingId: string, prescription: string): Promise<any> {
    try {
      const prescriptionInfo = await this.trainerRepository.addPrescription(bookingId, prescription);
      if (prescriptionInfo?.sessionType === 'Single Session') {
        await this.trainerRepository.updateSessionStatus(bookingId);
      }
      if (prescriptionInfo?.sessionType === 'Package Session') {
        const sessionData = await this.trainerRepository.getSession(prescriptionInfo.sessionId.toString());
        if (sessionData) {
          const startDate = moment(prescriptionInfo.startDate);
          const endDate = moment(prescriptionInfo.endDate);
          const totalDays = endDate.diff(startDate, 'days');
          const totalSessions = totalDays + 1;

          if (sessionData.completedSessions === undefined) {
            sessionData.completedSessions = 0;
          }
          if (sessionData.completedSessions < totalSessions) {
            let sessionCount = sessionData.completedSessions + 1; 
            await this.trainerRepository.updateSessionData(sessionData._id.toString(), sessionCount);
            if (sessionCount < totalSessions) {  
              await this.trainerRepository.updateSessionStatus(bookingId);
            }
          }
        }
      }
  
      return prescriptionInfo;
    } catch (error: any) {
      throw new Error(error);
    }
  }
  
  async getNotifications(trainerId: string): Promise<any> {
    try {
      return await this.trainerRepository.fetchNotifications(trainerId)
    } catch (error) {
      throw new Error('failed to find notifications')
    }
   }

   async clearNotifications(trainerId: string): Promise<any>  {
    try {
      return await this.trainerRepository.deleteTrainerNotifications(trainerId)
    } catch (error) {
      throw new Error('failed to delete notifications')
    }
   }

   async updatePrescription(bookingId: string, newPrescription: string): Promise<any> {
    try {
      const bookingDetails = await this.trainerRepository.fetchUserBooking(bookingId);
  
      if (!bookingDetails || bookingDetails.length === 0) {
        throw new Error("No booking details found.");
      }
      const { sessionCompletionTime } = bookingDetails[0];
  
      if (!sessionCompletionTime) {
        throw new Error("Booking date is invalid.");
      }
      const currentTime = new Date();
      const bookingTime = new Date(sessionCompletionTime);
      const minutesPassed = differenceInMinutes(currentTime, bookingTime);
      
      if (minutesPassed >= 0 && minutesPassed <= 60) {
        await this.trainerRepository.updatePrescriptionContect(bookingId, newPrescription);
        return {
          success: true,
          message: "Prescription updated successfully!",
        };
      } else if (minutesPassed > 60) {
        throw new Error("Prescription can no longer be updated. Time window expired.");
      } else {
        throw new Error("Prescription can only be updated after session completion.");
      }
    } catch (error: any) {
      console.error(`Error updating prescription: ${error.message}`);
      throw error;
    }
  }
  
  async getBooking(bookingId: string): Promise<any>  {
    return await this.trainerRepository.fetchUserBooking(bookingId)
  }

}

export default TrainerService;
