// trainerController.ts
import { NextFunction, Request, Response } from "express";
// import TrainerService from "../services/trainerServices";
import {ITrainerService} from '../../src/interface/trainer/Trainer.service.interface'
import { ITrainer } from "../interface/trainer_interface";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary";
class TrainerController {
  private trainerService: ITrainerService;

  constructor(trainerService: ITrainerService) {
    this.trainerService = trainerService;
  }

  async getAllSpecializations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('hit controller');
      
      const specializationsData = await this.trainerService.findAllSpecializations();
      res.status(200).json({ success: true, data: specializationsData });
    } catch (error) {
      next(error)
    }
  }

  async registerTrainer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainerData: ITrainer = req.body;
      const trainer = await this.trainerService.registerTrainer(trainerData);

      if (!trainer) {
        res.status(409).json({ message: "Email already exists" });
        return;
      }
      res.status(200).json({ message: "OTP sent to email" });
      return;
    } catch (error) {
      if ((error as Error).message === "Email already exists") {
        res.status(409).json({ message: "Email already exists" });
        return;
      } else {
        next(error)
      }
    }
  }

  async verifyOtp(req: Request, res: Response, next:NextFunction): Promise<void> {
    try {
      const { trainerData, otp } = req.body;
      await this.trainerService.verifyOTP(trainerData, otp);
      res.status(200).json({ message: "OTP verified successfully", treiner: trainerData });
    } catch (error) {
      if ((error as Error).message === "OTP has expired") {
        res.status(400).json({ message: "OTP has expired" });
      } else if ((error as Error).message === "Invalid OTP") {
        res.status(400).json({ message: "Invalid OTP" });
      } else if ((error as Error).message === "No OTP found for this email") {
        res.status(404).json({ message: "No OTP found for this email" });
      } else {
        next(error)
      }
    }
  }

  async resendOtp(
    req: Request<{ email: string }>,
    res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await this.trainerService.resendOTP(email);
      res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
      console.error("Resend OTP Controller error:", error);
      if ((error as Error).message === "User not found") {
        res.status(404).json({ message: "User not found" });
      } else {
       next(error)
      }
    }
  }

  async trainerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: ITrainer = req.body;
      const trainerData = await this.trainerService.trainerLogin({
        email,
        password,
      });

      if (trainerData) {
        const { accessToken, refreshToken, trainer } = trainerData;
        res.cookie("trainer_refresh_token", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
          message: "Login successful",
          trainer: trainer,
          token: accessToken,
        });
      }
    } catch (error: any) {
      if (error.message === "Trainer is blocked") {
        res.status(403).json({ message: "Trainer is blocked" });
      } else if (error.message === "Invalid email or password") {
        res.status(401).json({ message: "Invalid email or password" });
      } else if (error.message === "Trainer not exists") {
        res.status(404).json({ message: "Trainer not found" });
      } else {
        console.log("Login controller:", error);
       next(error)
      }
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) : Promise<void>{
    const trainer_refresh_token = req.cookies?.trainer_refresh_token;
    if (!trainer_refresh_token) {
      res.status(403).json({ message: "Refresh token not found" });
      return;
    }
    try {
      const newAccessToken = await this.trainerService.generateTokn(
        trainer_refresh_token
      );
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Error generating new access token:", error);
      next(error)
    }
  }

  async kycSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trainer_id, specialization, name, email, phone } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const formData = {
        trainer_id,
        specialization,
        name,
        email,
        phone,
      };
      const kycStatus = await this.trainerService.kycSubmit(formData, files);
      res.status(200).json({ message: "KYC submitted successfully", kycStatus });
    } catch (error) {
      next(error);
    }
  }
  

  async logoutTrainer(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("trainer_refresh_token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed", error });
    }
  }

  async trainerKycStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainerId = req.params.trainer_id;
      const kycStatus = await this.trainerService.kycStatus(trainerId);
      res.status(200).json({ kycStatus });
    } catch (error) {
      next(error)
    }
  }

  async resubmitkyc(req: Request, res: Response) : Promise<void>{
    try {
      const trainer_id = req.params.trainer_id;
      await this.trainerService.updateKycStatus(trainer_id);
      res.status(200).json({ message: "kyc updated" });
    } catch (error) {}
  }

  async getTrainer(req: Request, res: Response, next: NextFunction) : Promise<void>{
    try {
      const trainer_id = req.params.trainer_id;
      const trainerData = await this.trainerService.findTrainer(trainer_id);
      res.status(200).json({
        trainerData: trainerData,
      });
    } catch (error: any) {
      next(error)
    }
  }

  async updateTrainer(req: Request, res: Response, next: NextFunction) : Promise<void>{
    try {
      const trainer_id = req.params.trainer_id;
      const trainerData = req.body;
      const existingTrainerProfile = await this.trainerService.fetchTrainer(trainer_id)
      if(existingTrainerProfile?.profileImage) {
         await deleteFromCloudinary(existingTrainerProfile.profileImage)
      }
      const documents: { [key: string]: string | undefined } = {};
      if (req.file) {
        const profileImageUrl = await uploadToCloudinary(
          req.file.buffer,
          "trainer_profileImage"
        );
        documents.profileImage = profileImageUrl.secure_url;
      }
      const updatedTrainerData = { ...trainerData, ...documents };
      const updatedTrainer = await this.trainerService.updateTrainer(
        trainer_id,
        updatedTrainerData
      );
      res.status(200).json({
        message: "Trainer updated successfully",
        updatedTrainer,
      });
    } catch (error) {
      next(error);
    }
  }
  

  async fetchSpecialization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainer_id = req.params.trainer_id
      const specializations = await this.trainerService.fetchSpec(trainer_id)  
      res.status(200).json({specializations})    
    } catch (error) {
      next(error)
    }
  }

  async fetchRejectionReason(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainer_id = req.params.trainer_id;
      const rejectionData = await this.trainerService.fetchRejectionData(
        trainer_id
      );
      const reason = rejectionData ? rejectionData.reason : null;
      res.status(200).json({
        message: "Rejection reason fetched successfully",
        reason: reason,
      });
    } catch (error) {
      console.error("Error fetching rejection reason:", error);
      next(error)
    }
  }

  async storeSessionData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        recurrenceOption,
        specId,
        isSingleSession,
        selectedDate,
        startTime,
        startDate,
        endDate,
        endTime,
        price,
      } = req.body;
      const trainerId = req.params.trainer_id;

      const sessionData: any = {};
      if (isSingleSession) {
        sessionData.specializationId = specId;
        sessionData.isSingleSession = isSingleSession;
        sessionData.trainerId = trainerId;
        sessionData.startDate = selectedDate;
        sessionData.startTime = startTime;
        sessionData.endTime = endTime;
        sessionData.price = price;
      } else {
        sessionData.specializationId = specId;
        sessionData.isSingleSession = isSingleSession;
        sessionData.trainerId = trainerId;
        sessionData.startDate = startDate;
        sessionData.endDate = endDate;
        sessionData.startTime = startTime;
        sessionData.endTime = endTime;
        sessionData.price = price;
        sessionData.completedSessions = 0; 
      }

      const createdSessionData = await this.trainerService.AddNewSession(
        sessionData,
        recurrenceOption
      );
      
      res.status(201).json({ message: "Session created successfully.", createdSessionData });
    } catch (error: any) {
      if (error.message === "Time conflict with an existing session.") {
        res.status(400).json({ message: "Time conflict with an existing session." });
      } else if (error.message.includes("Daily session limit")) {
        res.status(400).json({ message: error.message });
      } else if (error.message === "End time must be after start time") {
        res.status(400).json({ message: "End time must be after start time" });
      } else if (
        error.message === "Session duration must be at least 30 minutes"
      ) {
        res.status(400).json({ message: "Session duration must be at least 30 minutes" });
      } else {
        next(error)
      }
    }
  }

  async getSessionSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainer_id = req.params.trainer_id;
      const sheduleData = await this.trainerService.getSessionSchedules(
        trainer_id
      );
      res.status(200).json({ message: "Session data feched sucessfully", sheduleData });
    } catch (error) {
     next(error)
    }
  }

  async deleteSessionSchedule(req: Request, res: Response): Promise<void> {
    let session_id = req.params.session_id;
    const deletedSchedule = await this.trainerService.deleteSession(session_id);
    res.status(200).json({
      message: "Session deleted successfully",
      deletedSchedule: deletedSchedule,
    });
  }

  async fetchBookingDetails(req: Request, res: Response, next: NextFunction) : Promise<void>{
    try {
      const trainer_id = req.params.trainer_id;
      const bookingDetails = await this.trainerService.getBookingDetails(
        trainer_id
      );
      res.status(200).json(bookingDetails);
    } catch (error) {
      next(error)
    }
  }

  async fetchUser(req: Request, res: Response, next: NextFunction) : Promise<void>{
    try {

      const userData = await this.trainerService.fetchUser(req.params.user_id)
      res.status(200).json(userData)
    } catch (error) {
      next(error)
    }
  }

  async getWalletData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trinerId = req.params.trainer_id
      const walletData = await this.trainerService.getWallet(trinerId)
      res.status(200).json(walletData)
    } catch (error) {
      next(error)
    }
  }

  async withdraw(req: Request, res: Response, next: NextFunction) : Promise<void>{
   try {
    const {trainer_id} = req.params
    const {amount} = req.body

    const withdrawed = await this.trainerService.withdraw(trainer_id, amount)
    res.status(200).json(withdrawed)
   } catch (error) {
    next(error)
   }
  }

  async addPrescriptionInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {booking_id} = req.params
      const prescriptions = req.body.data
      await this.trainerService.addPrescription(booking_id, prescriptions)
      res.status(200).json({message: 'Prescription sent successfully'})
    } catch (error) {
      next(error)
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trainer_id } = req.params;
      const notifications = await this.trainerService.getNotifications(trainer_id);
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async clearNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {trainer_id} = req.params
      await this.trainerService.clearNotifications(trainer_id)
      res.status(200).json({message:'Notifications cleared successfully'})
    } catch (error) {
      next(error)
    }
  }

  async updatePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params; 
      const { data: newPrescription } = req.body; 
      const result = await this.trainerService.updatePrescription(booking_id, newPrescription);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update prescription.",
      });
    }
  }
  
  async getUserBooking(req: Request, res: Response) {
    try {
      const {booking_id} = req.params
      const response = await this.trainerService.getBooking(booking_id)
      res.status(200).json(response)
    } catch (error) {
      
    }
  }

}

export default TrainerController;
