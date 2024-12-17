import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import messageService from "../services/messageService";

class MessageController {
  async sendMessage(req: Request, res: Response) {
    try {
      const { token, receiverId, message } = req.body;
      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as { id: string };
      const senderId = decoded.id;
      const sendMessage = await messageService.sendMessage(
        senderId,
        receiverId,
        message
      );
      if (!sendMessage) {
        res.status(200).json([]);
        return;
      }
      res.status(200).json(sendMessage);
    } catch (error) {
      console.log("Error in sendMessage controller", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMessage(req: Request, res: Response) {
    try {
      const {token, id} = req.params
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as { id: string };
      const senderId = decoded.id;
      const getMessages = await messageService.getMessage(
        senderId,
        id
      );
      res.status(200).json(getMessages);
    } catch (error) {
      console.log("Error in sendMessage controller", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

async getCallHistory(req: Request, res: Response) {
  const {trainerId} = req.params
  const respons = await messageService.getCallHistory(trainerId)
  res.status(200).json(respons)
}
async getCallHistoryUser(req: Request, res: Response) {
  const {userId} = req.params
  const respons = await messageService.getCallHistoryUser(userId)
  res.status(200).json(respons)
}

}

export default MessageController;
