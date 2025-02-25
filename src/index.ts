// index.ts
import express, { Application } from "express";
import cors from "cors";
import connectDB from "./utils/db";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute";
import AdminRoute from "./routes/adminRoute";
import TrainerRoute from "./routes/trainerRoute";
import MessagesRoute from "./routes/messagesRoute";
import errorMiddleware from "./middlewares/errorMiddleware";
import dotenv from 'dotenv';
import path from "path";
import { startDeleteExpiredSessionsCron } from './corn/deleteExpiredSessions';
import { app, server } from './socket/socket';

dotenv.config();

// MongoDB connection
connectDB();

// Start cron job
startDeleteExpiredSessionsCron();

app.use(cookieParser());
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/user/", userRoute);
app.use("/api/admin/", AdminRoute);
app.use("/api/trainer/", TrainerRoute);
app.use("/api/messages/", MessagesRoute);

// Error handling middleware
app.use(errorMiddleware);

// Server running
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
