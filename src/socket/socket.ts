import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import chatService from '../services/messageService';


dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

const userSocketMap: Record<string, string> = {}; 

//  let userSocketMap: {[key: string]: any} = {}

export const getReceiverSocketId = (receiverId: string) => {
  console.log('Getting receiver socket ID for:', receiverId);
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  // const trainerId = socket.handshake.query.trainerId as string;

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User connected with ID: ${userId} and socket ID: ${socket.id}`);
  }

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      console.log(`User with ID: ${userId} disconnected and removed from socket map`);
    }
  });


    socket.on('sendMessage', (data) => {
      if (userId) {
        io.emit('messageUpdate',data) 
      } else {
        console.error("receiverId is missing in sendMessage data");
      }
    });
 

  // Handle outgoing video calls
  socket.on("outgoing-video-call", (data) => {
    const userSocketId = getReceiverSocketId(data.to);
    if (userSocketId) {
      io.to(userSocketId).emit('incoming-video-call', {
        _id: data.to,
        from: data.from,
        callType: data.callType,
        trainerName: data.trainerName,
        trainerImage: data.trainerImage,
        roomId: data.roomId,
      });
    } else {
      console.log(`Receiver not found for user ID: ${data.to}`);
    }
  });

  socket.on("accept-incoming-call", async (data) => {
    // console.log("accept-incoming-call", data);
    try {
      const friendSocketId = await getReceiverSocketId(data.to);
      if (friendSocketId) {
        const startedAt = new Date();
        const videoCall = {
          trainerId: data.from,
          userId: data.to,
          roomId: data.roomId,
          duration: 0, // Duration will be updated later
          startedAt,
          endedAt: null, // Not ended yet
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Save call details to the database (simplified saving)
        await chatService.createVideoCallHistory(videoCall);
        socket.to(friendSocketId).emit("accepted-call", { ...data, startedAt });
      } else {
        console.error(`No socket ID found for the receiver with ID: ${data.to}`);
      }
    } catch (error: any) {
      console.error("Error in accept-incoming-call handler:", error.message);
    }
  });
  

  socket.on('trainer-call-accept',async (data) => {
    const trainerSocket = await getReceiverSocketId(data.trainerId)
    if(trainerSocket) {
      socket.to(trainerSocket).emit('trianer-accept', data)
    }
  })

  // Handle call rejection
  socket.on('reject-call', (data) => {
    const friendSocketId = getReceiverSocketId(data.to);
    if (friendSocketId) {
      socket.to(friendSocketId).emit('call-rejected');
    } else {
      console.error(`No socket ID found for the receiver with ID: ${data.to}`);
    }
  });

  socket.on("leave-room", (data) => {
    const friendSocketId = getReceiverSocketId(data.to);
    // console.log('friendSocketId',friendSocketId, 'data', data.to);
    if (friendSocketId) {
      socket.to(friendSocketId).emit("user-left",data.to);
    }
  });

  socket.on("newBookingNotification", (data) => {

    
    const receiverSocketId = getReceiverSocketId(data.receiverId);
  
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveNewBooking", data.content);
    } else {
      console.warn("Receiver not connected:", data.receiverId);
    }
  });
  

  socket.on('cancelTrainerNotification', (data) => {
    const receiverSocketId = getReceiverSocketId(data.recetriverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveCancelNotificationForTrainer", data.content);
      console.log("Notification sent to client:", data);
    } else {
      console.warn("No receiverSocketId found for receiverId:", data.receiverId);
    }
  });

  socket.on('cancelUserNotification', (data) => {
    const receiverSocketId = getReceiverSocketId(data.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveCancelNotificationForUser", data.content);
      console.log("Notification sent to client:", data);
    } else {
      console.warn("No receiverSocketId found for receiverId:", data.receiverId);
    }
  });
  

  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
  

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

export { app, io, server };
