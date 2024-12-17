import mongoose, { Schema, model } from "mongoose";
import { INotification, INotificationContent } from "../interface/common";


const notificationContentSchema = new Schema<INotificationContent>(
  {
    content: { type: String, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const notificationSchema = new Schema<INotification>(
  {
    receiverId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    notifications: [notificationContentSchema],
  },
  { timestamps: true }
);

notificationSchema.index({ receiverId: 1 }); // Index for fast retrieval by receiverId

const NotificationModel = model<INotification>("Notification", notificationSchema);
export default NotificationModel;
