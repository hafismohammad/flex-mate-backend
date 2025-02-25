import mongoose, { Schema, Document, model, models } from "mongoose";

// Interface for VideoCall
export interface IVideoCall extends Document {
  trainerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roomId: string; // Unique identifier for the call session
  duration: number; // Duration in seconds
  startedAt: Date; // Start time of the call
  endedAt: Date | null; // End time of the call
  createdAt: Date;
  updatedAt: Date;
}

// VideoCall Schema
const VideoCallSchema: Schema = new Schema(
  {
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: String, required: true },
    duration: { type: Number, default: 0 }, // Duration in seconds
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Model for VideoCall
export const VideoCallModel = models.VideoCall ||  model<IVideoCall>('VideoCall', VideoCallSchema);

export default VideoCallModel;