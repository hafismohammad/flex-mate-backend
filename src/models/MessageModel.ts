// src/models/messageModel.ts
import mongoose, { Schema, Document, model } from 'mongoose';

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    conversationId: mongoose.Types.ObjectId; 
    message: string;
    senderModel: 'User' | 'Trainer';
    receiverModel: 'User' | 'Trainer';
}

const messageSchema = new Schema<IMessage>(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', 
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
        },
        message: {
            type: String,
            required: true,
        },
        senderModel: {
            type: String,
            enum: ['User', 'Trainer'],
            required: true,
        },
        receiverModel: {
            type: String,
            enum: ['User', 'Trainer'],
            required: true,
        }
    },
    { timestamps: true }
);

const MessageModel = model<IMessage>('Message', messageSchema);
export default MessageModel;
