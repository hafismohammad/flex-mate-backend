import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import chatService from "../services/messageService";
import { log } from "console";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

const userSocketMap: Record<string, string[]> = {};
const onlineUser: { [key: string]: string } = {};


export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;

  if (userId) {
    console.log(`User connected: ${userId}, Socket: ${socket.id}`);
    (socket as any).userId = userId; 
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = []; 
  }
    userSocketMap[userId].push(socket.id);
    onlineUser[userId] = socket.id;
    // console.log('userSocketMap',userSocketMap);
    console.log('Emitted event: userSocketMap', Object.keys(userSocketMap));
    // Emit updated online users list to ALL clients
    io.emit("updateOnlineUsers", Object.keys(onlineUser));
    console.log('Emitted event: updateOnlineUsers', Object.keys(onlineUser));
  }

  socket.on("disconnect", () => {
    const disconnectedUserId = (socket as any).userId;  

    if (disconnectedUserId) {
      console.log(`User disconnected: ${disconnectedUserId}, Socket: ${socket.id}`);

      delete userSocketMap[disconnectedUserId];
      delete onlineUser[disconnectedUserId];

      // Emit updated online users list
      io.emit("updateOnlineUsers", Object.keys(onlineUser));
    }
  });

  socket.on("join", (userId) => {
    if (userId) {
      console.log(`User joined: ${userId}`);
      
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = [];
      }

      // userSocketMap[userId].push(socket.id);
      // onlineUser[userId] = socket.id;

      // Emit online users to everyone
      io.emit("updateOnlineUsers", Object.keys(onlineUser));
    }
  });

  

  socket.on("sendMessage", (data) => {
    if (userId) {
      io.emit("messageUpdate", data);
    } else {
      console.error("receiverId is missing in sendMessage data");
    }
  });

  // Handle outgoing video calls
  socket.on("outgoing-video-call", (data) => {
    const userSocketId = getReceiverSocketId(data.to);
    if (userSocketId) {
      io.to(userSocketId).emit("incoming-video-call", {
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
        console.error(
          `No socket ID found for the receiver with ID: ${data.to}`
        );
      }
    } catch (error: any) {
      console.error("Error in accept-incoming-call handler:", error.message);
    }
  });

  socket.on("trainer-call-accept", async (data) => {
    const trainerSocket = await getReceiverSocketId(data.trainerId);
    if (trainerSocket) {
      socket.to(trainerSocket).emit("trianer-accept", data);
    }
  });

  // Handle call rejection
  socket.on("reject-call", (data) => {
    const friendSocketId = getReceiverSocketId(data.to);
    if (friendSocketId) {
      socket.to(friendSocketId).emit("call-rejected");
    } else {
      console.error(`No socket ID found for the receiver with ID: ${data.to}`);
    }
  });

  socket.on("leave-room", (data) => {
    const friendSocketId = getReceiverSocketId(data.to);
    // console.log('friendSocketId',friendSocketId, 'data', data.to);
    if (friendSocketId) {
      socket.to(friendSocketId).emit("user-left", data.to);
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

  socket.on("chatNotification", (data) => {
    // console.log('chatNotification',data)
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    // console.log("Resolved receiverSocketId:", receiverSocketId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("sendChatNotification", data);

    } else {
      console.warn(`Receiver not connected for user ID: ${data.receiverId}`);
    }
  });

  socket.on("chatNotificationFromTrainer", (data: any) => {
    
    if (!data || !data.receiverId) {
      console.warn(
        "Received undefined or missing receiverId in chatNotificationFromTrainer",
        data
      );
      return;
    }
    
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    // console.log('chatNotificationFromTrainer',receiverSocketId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("sendChatNotificationFromTrainer", data);
    } else {
      console.warn(
        `Trainer receiver not connected for user ID: ${data.receiverId}`
      );
    }
  });

  // socket.on("chatNotificationFromTrainer", (data) => {
  //   const receiverSocketId = getReceiverSocketId(data.receiverId);

  //   if (receiverSocketId) {
  //     io.to(receiverSocketId).emit("sendChatNotificationFromTrainer", data);
  //   } else {
  //     console.warn("Receiver not connected:", data.receiverId);
  //   }
  // });

  socket.on("cancelTrainerNotification", (data) => {
    const receiverSocketId = getReceiverSocketId(data.recetriverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "receiveCancelNotificationForTrainer",
        data.content
      );
      console.log("Notification sent to client:", data);
    } else {
      console.warn(
        "No receiverSocketId found for receiverId:",
        data.receiverId
      );
    }
  });

  socket.on("cancelUserNotification", (data) => {
    const receiverSocketId = getReceiverSocketId(data.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "receiveCancelNotificationForUser",
        data.content
      );
      console.log("Notification sent to client:", data);
    } else {
      console.warn(
        "No receiverSocketId found for receiverId:",
        data.receiverId
      );
    }
  });
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      console.log("Updated userSocketMap after disconnect:", userSocketMap);
    }
  });
});

export { app, io, server };
