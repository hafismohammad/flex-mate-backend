import mongoose from "mongoose";

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  name: string;
  email: string;
  phone: number;
  password: string;
  dob?: string;
  image?: string;
  gender?: string;
  isBlocked: boolean;
}

export interface IOtp {
  _id?: mongoose.Types.ObjectId;
  otp: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IBooking {
    _id?: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    trainerId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId | undefined; 
    specialization?: string;
    sessionType: string;
    bookingDate: Date;
    startDate: Date;
    endDate: Date; 
    startTime: string;
    endTime: string;
    amount: number | undefined;
   paymentStatus: "Confirmed" | "Cancelled" | "Completed";
    createdAt: Date; 
    updatedAt: Date; 
    payment_intent?: string;
    prescription?: string
    sessionCompletionTime?: Date
  }

  export interface IVideoCall extends Document {
    trainerId: string
    userId:string
    roomId: string;
    startedAt: Date;
    duration: number; // in seconds
    endedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
export  interface IReview {
  userId: mongoose.Types.ObjectId
  trainerId: mongoose.Types.ObjectId
  rating: number
  comment: string
}
export interface INotificationContent {
  content: string;
  bookingId: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

export interface INotification {
  receiverId: mongoose.Types.ObjectId;
  notifications: INotificationContent[];
}


export interface IPrescriptionInfo {
  sessionId: {
    _id: string;
    completedSessions: number;
    // other fields from the session schema
  };
  sessionType: string;
  startDate: string;
  endDate: string;
  // other fields from the prescription schema
}