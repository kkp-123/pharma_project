import Notification from "../models/Notification.js";

//CREATE (Internal use)
export const createNotification = async (userId, message, type = "system") => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type
    });

    //SEND REAL-TIME EVENT
    try {
      const serverModule = await import("../server.js");
      const io = serverModule.io;
      const onlineUsers = serverModule.onlineUsers;
      const socketId = onlineUsers && onlineUsers[userId.toString()];

      if (socketId && io) {
        io.to(socketId).emit("newNotification", notification);
      }
    } catch (_) {}

  } catch (err) {
    console.error("Notification error:", err.message);
  }
};


//Get Notifications
export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
    isDeleted: false
  }).sort({ createdAt: -1 });

  res.json(notifications);
};

//Mark as Read
export const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Not found" });
  }

  notification.isRead = true;
  await notification.save();

  const socketId = onlineUsers[req.user._id.toString()];
  if (socketId) {
    io.to(socketId).emit("notificationUpdated");
  }

  res.json(notification);
};

//Delete One
export const deleteNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Not found" });
  }

  notification.isDeleted = true;
  await notification.save();

  const socketId = onlineUsers[req.user._id.toString()];
  if (socketId) {
    io.to(socketId).emit("notificationUpdated");
  }

  res.json({ message: "Deleted" });
};

//Clear All
export const clearAllNotifications = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id },
    { isDeleted: true }
  );

  const socketId = onlineUsers[req.user._id.toString()];
  if (socketId) {
    io.to(socketId).emit("notificationUpdated");
  }

  res.json({ message: "All cleared" });
};