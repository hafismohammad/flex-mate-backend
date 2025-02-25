import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IMessageService } from "../interface/chat/Chat.service.interface";

class MessageController {
  private messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { token, receiverId, message, senderName } = req.body;
      if (!token || !receiverId || !message) {
        res.status(400).json({ error: "Token, receiverId, and message are required" });
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as { id: string };
      const senderId = decoded.id;

      const sendMessage = await this.messageService.sendMessage(senderId, receiverId, message, senderName);

      if (!sendMessage) {
        res.status(404).json({ error: "Message could not be sent" });
        return;
      }

      res.status(200).json({ success: true, message: "Message sent successfully", data: sendMessage });
    } catch (error) {
      console.error("Error in sendMessage controller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMessage(req: Request, res: Response): Promise<void> {
    try {
      // const { token } = req.headers;
      const {token, id: userToChatId } = req.params;

      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      const decoded = jwt.verify(
        token as string,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as { id: string };
      const senderId = decoded.id;

      const getMessages = await this.messageService.getMessage(senderId, userToChatId);

      res.status(200).json({ success: true, data: getMessages });
    } catch (error) {
      console.error("Error in getMessage controller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getCallHistory(req: Request, res: Response): Promise<void> {
    try {
      const { trainerId } = req.params;

      if (!trainerId) {
        res.status(400).json({ error: "Trainer ID is required" });
        return;
      }

      const callHistory = await this.messageService.getCallHistory(trainerId);

      res.status(200).json({ success: true, data: callHistory });
    } catch (error) {
      console.error("Error in getCallHistory controller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getCallHistoryUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const callHistory = await this.messageService.getCallHistoryUser(userId);

      res.status(200).json({ success: true, data: callHistory });
    } catch (error) {
      console.error("Error in getCallHistoryUser controller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default MessageController;
