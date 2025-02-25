import { IMessage } from "../../models/MessageModel";
import { IVideoCall } from "../common";

export interface IMessageService {
  sendMessage(senderId: string, receiverId: string, message: string, senderName: string): Promise<IMessage>;
  getMessage(senderId: string, userToChatId: string): Promise<IMessage[]>;
  createVideoCallHistory(videoCall: IVideoCall): Promise<void>;
  getCallHistory(trainerId: string): Promise<IVideoCall[]>;
  getCallHistoryUser(userId: string): Promise<IVideoCall[]>;
}
