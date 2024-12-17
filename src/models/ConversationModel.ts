import mongoose, { Schema, Document, model } from 'mongoose';

interface IConversation extends Document {
  participants: Array<{
    participantId: mongoose.Types.ObjectId;
    participantModel: 'User' | 'Trainer';
  }>;
  messages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        participantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'participants.participantModel',
        },
        participantModel: {
          type: String,
          required: true,
          enum: ['User', 'Trainer'],
        },
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: []
      },
    ],
  },
  { timestamps: true }
);

const ConversationModel = model<IConversation>('Conversation', conversationSchema);
export default ConversationModel;
