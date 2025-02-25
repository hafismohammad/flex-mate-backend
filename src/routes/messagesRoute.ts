import express from "express";
import MessageController from "../controllers/messageController";
import messageService from "../services/messageService";

const router = express.Router();

const messageController = new MessageController(messageService); 

router.get("/call-history/:trainerId", (req, res) => messageController.getCallHistory(req, res));
router.get("/call-history-user/:userId", (req, res) => messageController.getCallHistoryUser(req, res));
router.get("/:token/:id", (req, res) => messageController.getMessage(req, res));
router.post("/send", (req, res) => messageController.sendMessage(req, res));

export default router;
