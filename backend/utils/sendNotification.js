import Notification from "../models/Notification.js";
import { io, onlineUsers } from "../server.js";

const sendNotification = async ({ user, message, type }) => {
  try {
    const notification = await Notification.create({
      user,
      message,
      type
    });

    // 🔥 FIX: convert ObjectId → string
    const socketId = onlineUsers[user.toString()];

    console.log("📡 Sending to:", user.toString());
    console.log("📡 Socket ID:", socketId);

    if (socketId) {
      io.to(socketId).emit("newNotification", notification);
    } else {
      console.log("❌ User not online");
    }

  } catch (err) {
    console.error(err);
  }
};

export default sendNotification;