import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import "./db.js";
import cors from "cors";
import http from "http"; //IMPORTANT
import { Server } from "socket.io";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;


// CREATE HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//Store user socket
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId.toString()] = socket.id;
  });
  
  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
  });
});

//  EXPORT (for controller use)

// ------------------- MIDDLEWARE -------------------
app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Global Request Deduplication & Anti-Multi-Submit Middleware
import { deduplicateRequests } from "./middleware/deduplicationMiddleware.js";
app.use(deduplicateRequests);

// ------------------- ROUTES -------------------
import authRoute from "./routes/authRoutes.js";
import leaveRoute from "./routes/leaveRoutes.js";
import attendanceRoute from "./routes/attendanceRoutes.js";
import salaryRoute from "./routes/salaryRoutes.js";
import inventoryRoute from "./routes/inventoryRoutes.js";
import batchRoute from "./routes/batchRoutes.js";
import qcRoute from "./routes/qcRoutes.js";
import holidayRoute from "./routes/holidayRoutes.js";
import bonusRoute from "./routes/bonusRoutes.js";
import productRoute from "./routes/productRoutes.js";
import adminRoute from "./routes/adminRoutes.js";
import userRoute from "./routes/userRoutes.js";
import updateProfileRoute from "./routes/updateProfileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoute from "./routes/dashboardRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

import productionDemandRoutes from "./routes/productionDemandRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import forecastRoutes from "./routes/forecastRoutes.js";

app.get("/", (req, res) => {
  res.send("Pharmaceutical Company Management System API is running");
});

app.use("/api/auth", authRoute);
app.use("/api/leave", leaveRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/salary", salaryRoute);
app.use("/api/inventory", inventoryRoute);
app.use("/api/batch", batchRoute);
app.use("/api/qc", qcRoute);
app.use("/api/holidays", holidayRoute);
app.use("/api/bonus", bonusRoute);
app.use("/api/products", productRoute);
app.use("/api/admin", adminRoute);
app.use("/api/admin", auditLogRoutes);
app.use("/api/users", userRoute);
app.use("/api/users", updateProfileRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", dashboardRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/sales", salesRoutes);
app.use("/api/production-demand", productionDemandRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/forecast", forecastRoutes);


import { settleMissedCheckoutsAndAbsents } from "./utils/attendanceSettlement.js";

//  USE server.listen (NOT app.listen)
server.listen(port, () => {
  console.log("Server running on port", port);

  // Run initial attendance auto-settlement on startup
  settleMissedCheckoutsAndAbsents();

  // Run automated attendance auto-settlement every hour
  setInterval(() => {
    settleMissedCheckoutsAndAbsents();
  }, 60 * 60 * 1000);
});

export { io, onlineUsers };