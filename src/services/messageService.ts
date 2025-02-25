// src/services/messageService.ts
import MessageModel, { IMessage } from "../models/MessageModel";
import UserModel from "../models/userModel";
import TrainerModel from "../models/trainerModel";
import ConversationModel from "../models/ConversationModel";
import mongoose from "mongoose";
import BookingModel from "../models/booking";
import { getReceiverSocketId, io } from "../socket/socket";
import notificationModel from "../models/notificationModel";

import VideoCallModel from "../models/videoCallModel";
import { INotificationContent } from "../interface/common";

class MessageService {
  async sendMessage(
    senderId: string,
    receiverId: string,
    message: string,
    senderName: string
  ): Promise<IMessage> {
    let senderModel: "User" | "Trainer" | null = null;
    let receiverModel: "User" | "Trainer" | null = null;

    if (await UserModel.exists({ _id: senderId })) {
      senderModel = "User";
    } else if (await TrainerModel.exists({ _id: senderId })) {
      senderModel = "Trainer";
    }

    if (await UserModel.exists({ _id: receiverId })) {
      receiverModel = "User";
    } else if (await TrainerModel.exists({ _id: receiverId })) {
      receiverModel = "Trainer";
    }

    if (!senderModel || !receiverModel) {
      throw new Error("Invalid sender or receiver ID");
    }

    let existingConversation = await ConversationModel.findOne({
      participants: {
        $all: [
          {
            participantId: new mongoose.Types.ObjectId(senderId),
            participantModel: senderModel,
          },
          {
            participantId: new mongoose.Types.ObjectId(receiverId),
            participantModel: receiverModel,
          },
        ],
      },
    });

    if (!existingConversation) {
      existingConversation = new ConversationModel({
        participants: [
          {
            participantId: new mongoose.Types.ObjectId(senderId),
            participantModel: senderModel,
          },
          {
            participantId: new mongoose.Types.ObjectId(receiverId),
            participantModel: receiverModel,
          },
        ],
        messages: [],
      });
      await existingConversation.save();
    }

    const newMessage = new MessageModel({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      message,
      senderModel,
      receiverModel,
      conversationId: existingConversation._id,
    });

    try {
      const savedMessage: IMessage = await newMessage.save();
      existingConversation.messages.push(
        savedMessage._id as mongoose.Types.ObjectId
      );
      await existingConversation.save();

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", savedMessage);
      }
      
      
      
      const notificationContent: INotificationContent = {
          content: `New message from ${senderName}: ${message} (${new Date().toLocaleTimeString()})`,
          read: false,
          createdAt: new Date(),
      };
      

      let receiverNotification = await notificationModel.findOne({
        receiverId,
      });

      if (receiverNotification) {
        receiverNotification.notifications.push(notificationContent);
        await receiverNotification.save();
      } else {
        receiverNotification = await notificationModel.create({
          receiverId,
          notifications: [notificationContent],
        });
      }

      // if (receiverSocketId) {
      //     io.to(receiverSocketId).emit("newNotification", notificationContent);
      // }

      return savedMessage;
    } catch (error) {
      console.error("Error saving message:", error);
      throw new Error("Failed to send message");
    }
  }

  async getMessage(senderId: string, userToChatId: string): Promise<any> {
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(userToChatId);

    const senderModel = (await UserModel.exists({ _id: senderObjectId }))
      ? "User"
      : (await TrainerModel.exists({ _id: senderObjectId }))
      ? "Trainer"
      : null;
    const receiverModel = (await UserModel.exists({ _id: receiverObjectId }))
      ? "User"
      : (await TrainerModel.exists({ _id: receiverObjectId }))
      ? "Trainer"
      : null;

    if (!senderModel || !receiverModel) {
      throw new Error("Invalid sender or receiver ID");
    }

    const conversations = await ConversationModel.find({
      participants: {
        $all: [
          {
            $elemMatch: {
              participantId: senderObjectId,
              participantModel: senderModel,
            },
          },
          {
            $elemMatch: {
              participantId: receiverObjectId,
              participantModel: receiverModel,
            },
          },
        ],
      },
    }).populate("messages");

    const allConversations = conversations.flatMap(
      (conversation) => conversation.messages
    );

    return allConversations;
  }

  async createVideoCallHistory(videoCall: any): Promise<void> {
    await VideoCallModel.create(videoCall);
  }

  async getCallHistory(trainer_id: string): Promise<any> {
    try {
      console.log("hit service", trainer_id);

      const callHistory = await VideoCallModel.find({
        trainerId: trainer_id,
      })
        .populate("userId")
        .sort({ startedAt: -1 });

      return callHistory;
    } catch (error) {
      console.error("Error fetching call history:", error);
      throw new Error("Error fetching call history");
    }
  }

  async getCallHistoryUser(userId: string): Promise<any> {
    try {
      const callHistory = await VideoCallModel.find({ userId: userId })
        .populate("trainerId")
        .sort({ startedAt: -1 });
      return callHistory;
    } catch (error) {
      console.error("Error fetching call history:", error);
      throw new Error("Error fetching call history");
    }
  }
}

export default new MessageService();
