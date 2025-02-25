// trainerRepository.js

import { ISession, ITrainer } from "../interface/trainer_interface";
import { IBooking, IOtp, IUser } from "../interface/common";
import SpecializationModel from "../models/specializationModel";
import TrainerModel from "../models/trainerModel";
import OtpModel from "../models/otpModel";
import KYCModel from "../models/KYC_Model";
import KycRejectionReasonModel from "../models/kycRejectionReason";
import SessionModel from "../models/sessionModel";
import mongoose, { Types } from "mongoose";
import moment from "moment";
import BookingModel from "../models/booking";
import UserModel from "../models/userModel";
import WalletModel, { ITransaction } from "../models/walletModel";
import NotificationModel from "../models/notificationModel";

import { ITrainerRepository } from "../interface/trainer/Trainer.repository.interface";

class TrainerRepository implements ITrainerRepository {
  private specializationModel = SpecializationModel;
  private trainerModel = TrainerModel;
  private otpModel = OtpModel;
  private kycModel = KYCModel;
  private kycRejectionModel = KycRejectionReasonModel;
  private sessionModel = SessionModel;
  private bookingModel = BookingModel;
  private walletModel = WalletModel;
  private notificationModel = NotificationModel

  async findAllSpecializations() {
    try {
      return await this.specializationModel.find({});
    } catch (error) {
      throw error;
    }
  }

  async existsTrainer(email: string): Promise<ITrainer | null> {
    try {
      // Attempt to find the trainer by email
      const trainer = await this.trainerModel.findOne({ email });
      return trainer;
    } catch (error) {
      // Log or handle the error more gracefully if needed
      console.error(`Error checking if trainer exists with email: ${email}`, error);
      throw new Error('Error checking trainer existence.');
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

  async findTrainerSpecializations(specializationNames: any): Promise<Types.ObjectId[]> {
    try {
      const specializations = await this.specializationModel.find({
        name: { $in: specializationNames },
      });
      return specializations.map((spec) => spec._id);
    } catch (error) {
      console.log("Error in finding trainer specializations:", error);
      return [];
    }
  }

  async createNewTrainer(trainerData: ITrainer): Promise<void> {
    try {
      await this.trainerModel.create(trainerData);
    } catch (error) {
      console.error("Error in creating User:", error);
      throw error;
    }
  }

async deleteOtpById(otpId?: string): Promise<void> {
  try {
    if (!otpId) {
      throw new Error("OTP ID is undefined");
    }
    await this.otpModel.findByIdAndDelete(new mongoose.Types.ObjectId(otpId));
    console.log(`OTP with ID ${otpId} deleted successfully.`);
  } catch (error) {
    console.error("Error in deleting OTP:", error);
    throw error;
  }
}

  async findTrainer(email: string): Promise<ITrainer | null> {
    try {
      return await this.trainerModel.findOne({ email });
    } catch (error) {
      console.log("Error finding user:", error);
      return null;
    }
  }

  async getOldImages(trainerId: string): Promise<any> {
    try {
      const kycData = await this.kycModel.findOne({trainerId: trainerId });
      return kycData;
    } catch (error) {
      console.error("Error fetching old KYC images:", error);
      throw new Error("Failed to fetch old KYC images");
    }
  }
  
  async saveKyc(formData: any, documents: any): Promise<any> {
    try {
      const specializationIds = Array.isArray(formData.specialization)
        ? formData.specialization.map((id: string) => new Types.ObjectId(id))
        : [new Types.ObjectId(formData.specialization)];

      const kycData = {
        trainerId: new Types.ObjectId(formData.trainer_id),
        specializationId: specializationIds,
        profileImage: documents.profileImageUrl,
        aadhaarFrontImage: documents.aadhaarFrontSideUrl,
        aadhaarBackImage: documents.aadhaarBackSideUrl,
        certificate: documents.certificateUrl,
        kycStatus: "pending",
        kycSubmissionDate: new Date(),
      };

      const savedKyc = await this.kycModel.create(kycData);
      return savedKyc;
    } catch (error) {
      console.error("Error in saveKyc repository:", error);
      throw new Error("Failed to save KYC data");
    }
  }

  async getTrainerStatus(trainerId: string) : Promise<any>  {
    try {
      const trainer = await this.trainerModel.findById(trainerId).select("kycStatus");
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }
      return trainer.kycStatus;
    } catch (error) {
      console.error("Error fetching trainer KYC status:", error);
      throw new Error("Failed to fetch trainer KYC status");
    }
  }


  

  async changeKycStatus(trainerId: string, profileImage: string | undefined): Promise<string | undefined> {
    try {
      const trainerUpdate = await this.trainerModel.findByIdAndUpdate(
        trainerId,
        {
          kycStatus: "submitted",
          profileImage: profileImage,
        },
        { new: true, runValidators: true }
      );
  
      if (!trainerUpdate) {
        throw new Error("Trainer not found");
      }
      await this.kycModel.findOneAndUpdate(
        { trainerId: trainerId },
        { kycStatus: "submitted" },
        { new: true, runValidators: true }
      );
  
      return trainerUpdate.kycStatus;
    } catch (error) {
      console.error("Error changing trainer KYC status:", error);
      throw new Error("Failed to change trainer KYC status");
    }
  }
  

  async updateKycStatus(trainerId: string): Promise<any>  {
    try {
      const updatedTrainer = await this.trainerModel.findByIdAndUpdate(
        trainerId,
        { $unset: { kycStatus: "" } },
        { new: true }
      );

      if (updatedTrainer) {
        console.log("KYC status field removed successfully:");
      } else {
        console.log("Trainer not found with the given ID:", trainerId);
      }
      return updatedTrainer;
    } catch (error) {
      console.error("Error removing KYC status field:", error);
      throw new Error("Failed to update KYC status"); 
    }
  }

  async fetchTrainer(trainer_id: string): Promise<any> {
    try {
      const trainerData = await this.trainerModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(trainer_id) },
        },
        {
          $lookup: {
            from: "specializations",
            localField: "specializations",
            foreignField: "_id",
            as: "specializationDetails",
          },
        },
      ]);
      return trainerData;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getTrainerProfile(trainer_id: string) {
    try {
      const trainerData = await this.trainerModel.findById(trainer_id) 
      return trainerData?.profileImage
    } catch (error) {
      
    }
  }

  async updateTrainerData(trainer_id: string): Promise<ITrainer> {
    try {
      const existingTrainer = await this.trainerModel.findById(trainer_id);
      if (!existingTrainer) {
        throw new Error("Trainer not found");
      }
      return existingTrainer;
    } catch (error) {
      console.error("Error in repository layer:", error);
      throw new Error("Failed to update trainer data");
    }
  }

  async fetchSpec(traienr_id: string): Promise<any> {
    try {
      const specializations = await this.trainerModel.findById({ _id: traienr_id }).populate("specializations");
      return specializations?.specializations  || [];
    } catch (error) {
      throw new Error("Failed to fetch specializations");
    }
  }

  async fetchRejectionData(trainerId: string) {
    try {
      const rejectionData = await this.kycRejectionModel.findOne({
        trainerId: trainerId,
      });
      return rejectionData;
    } catch (error) {
      console.error("Error fetching rejection data:", error);
      throw error;
    }
  }

    async createMultipleSessions(sessions: ISession[]) : Promise<ISession[]> {
      try {
        for (const session of sessions) {
          const allSessions = await this.sessionModel.find({
            trainerId: session.trainerId,
          });
          const hasConflict = allSessions.some((existingSession) => {
            const existingStartDate = moment(existingSession.startDate);
            const existingEndDate = existingSession.endDate
              ? moment(existingSession.endDate)
              : existingStartDate;

            const existingStartTime = moment(existingSession.startTime, "HH:mm");
            const existingEndTime = moment(existingSession.endTime, "HH:mm");

            const newStartDate = moment(session.startDate);
            const newEndDate = session.endDate
              ? moment(session.endDate)
              : newStartDate;

            const newStartTime = moment(session.startTime, "HH:mm");
            const newEndTime = moment(session.endTime, "HH:mm");

            const dateRangeOverlaps =
              newStartDate.isSameOrBefore(existingEndDate) &&
              newEndDate.isSameOrAfter(existingStartDate);
            const timeRangeOverlaps =
              newStartTime.isBefore(existingEndTime) &&
              newEndTime.isAfter(existingStartTime);

            return dateRangeOverlaps && timeRangeOverlaps;
          });

          if (hasConflict)
            throw new Error(
              `Time conflict detected for session on ${session.startDate}`
            );

          // Validate price as a number
          session.price = Number(session.price);
          if (isNaN(session.price)) throw new Error("Invalid session price.");
        }

        // Insert sessions in batch and retrieve the inserted documents
        const createdSessions = await this.sessionModel.insertMany(sessions, {
          ordered: true,
        })

         // Populate specializationId after inserting
        const populatedSessions = await this.sessionModel
        .find({ _id: { $in: createdSessions.map((s) => s._id) } })
        .populate("specializationId");


        return populatedSessions;
      } catch (error) {
        console.error("Error creating multiple sessions:", error);
        throw error;
      }
    }

  async createNewSession(sessionData: ISession): Promise<ISession> {
    try {
      const trainer = await this.trainerModel.findById(sessionData.trainerId);
      if (!trainer) throw new Error("Trainer not found.");

      // Check for date and time conflicts
      const existingSessions = await this.sessionModel.find({
        trainerId: sessionData.trainerId,
        $or: [
          {
            startDate: {
              $gte: sessionData.startDate,
              $lte: sessionData.endDate,
            },
          },
          {
            startDate: sessionData.startDate,
            endDate: null,
          },
        ],
      });

      const hasConflict = existingSessions.some((existingSession) => {
        const existingStartDate = moment(existingSession.startDate);
        const existingEndDate = existingSession.endDate
          ? moment(existingSession.endDate)
          : existingStartDate;

        const existingStartTime = moment(existingSession.startTime, "HH:mm");
        const existingEndTime = moment(existingSession.endTime, "HH:mm");

        const newStartDate = moment(sessionData.startDate);
        const newEndDate = sessionData.endDate
          ? moment(sessionData.endDate)
          : newStartDate;

        const newStartTime = moment(sessionData.startTime, "HH:mm");
        const newEndTime = moment(sessionData.endTime, "HH:mm");

        // Check date and time overlap
        const dateRangeOverlaps =
          newStartDate.isSameOrBefore(existingEndDate) &&
          newEndDate.isSameOrAfter(existingStartDate);

        const timeRangeOverlaps =
          newStartTime.isBefore(existingEndTime) &&
          newEndTime.isAfter(existingStartTime);

        return dateRangeOverlaps && timeRangeOverlaps;
      });

      if (hasConflict)
        throw new Error("Time conflict with an existing session.");

      sessionData.price = Number(sessionData.price);

      // Create the session with multiple specializations
      const createdSessionData = (
        await this.sessionModel.create(sessionData)
      ).populate("specializationId");

      return createdSessionData;
    } catch (error) {
      console.error("Detailed error in createNewSession:", error);
      throw error;
    }
  }

  async fetchSessionData(trainer_id: string): Promise<ISession[]> {
    try {
      const sesseionData = await this.sessionModel.find({ trainerId: trainer_id,}).populate("specializationId").sort({ createdAt: -1 });
      return sesseionData;
    } catch (error) {
      throw error;
    }
  }

  async deleteSession(session_id: string): Promise<boolean> {
    try {
      const deletedSchedule = await this.sessionModel.findByIdAndDelete(
        session_id
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  async fetchBookingDetails(trainer_id: string): Promise<IBooking[]>  {
    try {
      const bookingDetails = await this.bookingModel.aggregate([
        { $match: { trainerId: new mongoose.Types.ObjectId(trainer_id) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
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
            path: "$userDetails",
            preserveNullAndEmptyArrays: true, // Preserve if user details are not found
          },
        },
        {
          $unwind: {
            path: "$trainerDetails",
            preserveNullAndEmptyArrays: true, // Preserve if trainer details are not found
          },
        },
        {
          $unwind: {
            path: "$sessionDetails",
            preserveNullAndEmptyArrays: true, // Preserve if session details are not found
          },
        },
        {
          $lookup: {
            from: "specializations",
            localField: "sessionDetails.specializationId", 
            foreignField: "_id",
            as: "specializationDetails",
          },
        },
        {
          $unwind: {
            path: "$specializationDetails",
            preserveNullAndEmptyArrays: true, 
          },
        },
        {
          $project: {
            bookingId: "$_id",
            userId: "$userDetails._id",
            userName: "$userDetails.name",
            userImage: "$userDetails.image",
            userMail: '$userDetails.email',
            trainerName: "$trainerDetails.name",
            sessionDate: {
              $ifNull: ["$sessionDetails.startDate", null], // If session is deleted, show as null
            },
            sessionType: "$sessionType",
            sessionStartTime: "$startTime",
            sessionEndTime: "$endTime",
            bookingDate: "$bookingDate",
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
            amount: "$amount",
            paymentStatus: "$paymentStatus",
            prescription: "$prescription",
            specialization: {
              id: "$specializationDetails._id",
              name: "$specializationDetails.name",
            },
            sessionStatus: "$sessionDetails.status",
          },
        },
        {
          $sort: {
            bookingDate: -1,
          },
        },
      ]);

      return bookingDetails;
    } catch (error) {
      throw error;
    }
  }

  async fetchUeserDetails(userId: string): Promise<IUser | null>  {
    try {
      const userData = await UserModel.findById(userId);
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any>  {
    try {
      return await this.sessionModel.findById(sessionId, {isSingleSession:false})
    } catch (error) {
      
    }
  }
  
  async updateSessionData(sessionId: string, sessionCount: number): Promise<ISession> {
    try {
      const session = await this.sessionModel.findByIdAndUpdate(
        sessionId,
        { $set: { completedSessions: sessionCount } }, 
        { new: true } 
      );
  
      if (!session) {
        throw new Error("Session not found");
      }
      return session;
    } catch (error) {
      console.error("Error updating session data:", error);
      throw error;
    }
  }
  
  //-

  async updateSessionStatus(bookingId: string): Promise<any> {
    try {
      const bookingDetails = await this.bookingModel.findByIdAndUpdate(
        { _id: bookingId },
        { paymentStatus: "Completed" },
        { new: true }
      );

      if (!bookingDetails) {
        throw new Error("Booking not found");
      }

      let wallet = await this.walletModel.findOne({
        trainerId: bookingDetails.trainerId,
      });

      const transactionId =
        "txn_" + Date.now() + Math.floor(Math.random() * 10000);
      if (bookingDetails.amount) {
        const transactionAmount = 0.9 * bookingDetails.amount;
        const transaction: ITransaction = {
          amount: transactionAmount,
          transactionId: transactionId,
          transactionType: "credit",
          bookingId: bookingId,
          date: new Date(),
        };

        if (wallet) {
          wallet.transactions.push(transaction);
          wallet.balance += transactionAmount;
          await wallet.save();
        } else {
          wallet = new this.walletModel({
            trainerId: bookingDetails.trainerId,
            balance: transactionAmount,
            transactions: [transaction],
          });
          await wallet.save();
        }
      }

      return bookingDetails;
    } catch (error) {
      console.error("Error updating session status:", error);
      throw error;
    }
  }

  async fetchWalletData(trainer_id: string): Promise<any> {
    try {
      const walletData = await this.walletModel.findOne({
        trainerId: trainer_id,
      });
      return walletData;
    } catch (error) {}
  }

  async withdrawMoney(trainer_id: string, amount: number): Promise<any> {
    try {
      const wallet = await this.walletModel.findOne({ trainerId: trainer_id });
      if (!wallet) {
        throw new Error("Wallet not found for the specified Trainer.");
      }
      if (wallet.balance < amount) {
        throw new Error("Insufficient balance for withdrawal.");
      }
      wallet.balance -= amount;
      const transactionId =
        "txn_" + Date.now() + Math.floor(Math.random() * 10000);
      const transaction: ITransaction = {
        amount: amount,
        transactionId: transactionId,
        transactionType: "debit",
      };
      wallet.transactions.push(transaction);
      await wallet.save();
      return wallet;
    } catch (error: any) {
      console.error("Error processing withdrawal:", error.message);
      throw new Error(error.message);
    }
  }

async addPrescription(bookingId: string, prescriptions: string): Promise<any> {
  try {
    const prescriptionInfo = await this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          prescription: prescriptions,
          sessionCompletionTime: Date.now(),
        },
      },
      {
        new: true, 
        runValidators: true, 
      }
    );
    return prescriptionInfo;
  } catch (error) {
    console.error("Error updating prescription:", error);
    throw error;
  }
}

  async fetchNotifications(trainerId: string): Promise<any> {
    try {
      const notificationsDoc = await this.notificationModel.findOne({ receiverId: trainerId });
      if (notificationsDoc && notificationsDoc.notifications) {
        notificationsDoc.notifications.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }
      return notificationsDoc;
    } catch (error) {
      console.error('Error finding notifications');
      throw new Error('Failed to find notifications')
      
    }
  }

  async deleteTrainerNotifications(trainerId: string): Promise<void> {
    try {
      await this.notificationModel.deleteOne({receiverId: trainerId})
    } catch (error) {
      console.error('Error delete notifications');
      throw new Error('Failed to delete notifications');
    }
  }

  async updatePrescriptionContect(bookingId: string, newPrescription: string): Promise<void> {
    try {
     const data = await this.bookingModel.findByIdAndUpdate(bookingId, {prescription: newPrescription})
    } catch (error) {
      console.error('Error delete notifications');
      throw new Error('Failed to delete notifications');
    }
  }

  async fetchUserBooking(bookingId: string): Promise<any> {
    try {
      const bookingDetails = await this.bookingModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(bookingId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
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
            path: "$userDetails",
            preserveNullAndEmptyArrays: true, // Preserve if user details are not found
          },
        },
        {
          $unwind: {
            path: "$trainerDetails",
            preserveNullAndEmptyArrays: true, // Preserve if trainer details are not found
          },
        },
        {
          $unwind: {
            path: "$sessionDetails",
            preserveNullAndEmptyArrays: true, // Preserve if session details are not found
          },
        },
        {
          $lookup: {
            from: "specializations",
            localField: "sessionDetails.specializationId", 
            foreignField: "_id",
            as: "specializationDetails",
          },
        },
        {
          $unwind: {
            path: "$specializationDetails",
            preserveNullAndEmptyArrays: true, 
          },
        },
        {
          $project: {
            bookingId: "$_id",
            userId: "$userDetails._id",
            userName: "$userDetails.name",
            userImage: "$userDetails.image",
            userMail: '$userDetails.email',
            trainerName: "$trainerDetails.name",
            sessionDate: {
              $ifNull: ["$sessionDetails.startDate", null], // If session is deleted, show as null
            },
            sessionType: "$sessionType",
            sessionStartTime: "$startTime",
            sessionEndTime: "$endTime",
            bookingDate: "$bookingDate",
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
            amount: "$amount",
            sessionCompletionTime: '$sessionCompletionTime',
            paymentStatus: "$paymentStatus",
            prescription: "$prescription",
            specialization: {
              id: "$specializationDetails._id",
              name: "$specializationDetails.name",
            },
            sessionStatus: "$sessionDetails.status",
          },
        },
        {
          $sort: {
            bookingDate: -1,
          },
        },
      ]);
      return bookingDetails
    } catch (error) {
      
    }
  }

  static async getIsBlockedTrainer(trainer_id: string): Promise<boolean> {
    try {
      const trainer = await TrainerModel.findById(trainer_id);
      return trainer?.isBlocked ?? false;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch trainer's blocked status: ${error.message}`
      );
    }
  }
}

export default TrainerRepository;
