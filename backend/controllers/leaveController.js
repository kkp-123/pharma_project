import Leave from "../models/Leave.js";
import User from "../models/User.js";
import sendNotification from "../utils/sendNotification.js";
import { createNotification } from "./notificationController.js";

// APPLY LEAVE (Employee)
export const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    const employee = await User.findById(req.user._id);

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!employee.manager) {
      return res.status(400).json({ message: "No manager assigned" });
    }

    // prevent overlapping leave
    const overlappingLeave = await Leave.findOne({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        message: "Leave already exists for selected dates"
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      manager: employee.manager,
      type,
      startDate,
      endDate,
      reason
    });

    // notification (KEEP BOTH SYSTEMS AS YOU WANTED)
    await sendNotification({
      user: employee.manager,
      message: `${employee.name} applied for leave`,
      type: "leave"
    });

    // await createNotification(
    //   employee.manager,
    //   `${employee.name} applied for leave`,
    //   "leave"
    // );

    return res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



// APPROVE / REJECT LEAVE (Manager)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leaveId = req.params.id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // prevent double action
    if (leave.status !== "pending") {
      return res.status(400).json({
        message: `Leave already ${leave.status}`
      });
    }

    if (status === "approved") {
      const days =
        (new Date(leave.endDate) - new Date(leave.startDate)) /
        (1000 * 60 * 60 * 24) +
        1;

      const employee = await User.findById(leave.employee);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const leaveType = leave.type;

      let isPaid = true;

      // Check balance
      const balance = employee.leaveBalance?.[leaveType] || 0;

      if (balance >= days) {
        employee.leaveBalance[leaveType] -= days;
      } else if (balance > 0) {
        // Partial paid, partial unpaid
        employee.leaveBalance[leaveType] = 0;
        isPaid = false; // treat as unpaid for simplicity
      } else {
        // No balance → unpaid
        isPaid = false;
      }

      await employee.save();

      // Save result in leave
      leave.isPaid = isPaid;
    }
    leave.status = status;
    await leave.save();

    //notifications
    await sendNotification({
      user: leave.employee,
      message: `Your leave has been ${status}`,
      type: "leave"
    });


    return res.json({
      success: true,
      message: `Leave ${status}`,
      leave
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//GET MANAGER LEAVES
export const getManagerLeaves = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { manager: req.user._id };

    const leaves = await Leave.find(filter)
      .populate("employee", "name email department")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: leaves.length,
      leaves
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



//GET MY LEAVES (Employee)
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.user._id
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      leaves
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};