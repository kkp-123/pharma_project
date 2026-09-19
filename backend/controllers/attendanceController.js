import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import Location from "../models/Location.js";
import User from "../models/User.js";
import { getDistance } from "../utils/distance.js";
import { createNotification } from "./notificationController.js";
import { logAudit } from "../utils/auditLogger.js";

//
// HELPER: Parse Expected Time "HH:MM" for today
//
const getExpectedTime = (timeString = "09:30") => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const d = new Date();
  d.setHours(hours || 9, minutes || 30, 0, 0);
  return d;
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

//
// CHECK-IN (Face Recognition or Location based)
//
export const checkIn = async (req, res) => {
  try {
    const today = getTodayDateString();
    const now = new Date();

    const {
      lat,
      lng,
      faceVerified = false,
      faceConfidence = 0,
      verificationMethod = "location"
    } = req.body;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Office Location Check
    const office = await Location.findOne({ isActive: true });
    let distanceFromOffice = 0;

    if (office && lat && lng) {
      distanceFromOffice = getDistance(
        lat,
        lng,
        office.latitude,
        office.longitude
      );

      // If purely GPS-based (no biometric face verification) and outside office radius
      if (!faceVerified && distanceFromOffice > office.radius) {
        return res.status(400).json({
          success: false,
          message: `Outside allowed office area (Distance: ${Math.round(distanceFromOffice)}m, Radius: ${office.radius}m). Use Face Attendance or move closer.`
        });
      }
    }

    // Check if already checked in today
    const existing = await Attendance.findOne({
      employee: req.user._id,
      $or: [
        { date: today },
        { checkIn: { $gte: startOfDay, $lte: endOfDay } }
      ]
    }).sort({ createdAt: -1 });

    if (existing && existing.checkIn) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in for today.",
        attendance: existing
      });
    }

    // Holiday check
    const holiday = await Holiday.findOne({ date: today });
    const day = now.getDay();
    const isSunday = day === 0;

    // Late Arrival Calculation
    const expectedStartStr = process.env.EXPECTED_START_TIME || "09:30";
    const expectedStartTime = getExpectedTime(expectedStartStr);

    let lateMinutes = 0;
    if (now > expectedStartTime) {
      lateMinutes = Math.round((now - expectedStartTime) / (1000 * 60));
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: now,
      location: { lat: lat || 0, lng: lng || 0 },
      checkInLocation: { lat: lat || 0, lng: lng || 0 },
      faceVerified: !!faceVerified,
      faceConfidence: Number(faceConfidence) || 95,
      verificationMethod: faceVerified ? "face" : (verificationMethod || "location"),
      lateMinutes,
      isHoliday: !!holiday,
      isSunday,
      status: "present",
      notes: distanceFromOffice > 0 ? `Distance: ${Math.round(distanceFromOffice)}m` : ""
    });

    await createNotification(
      req.user._id,
      `Checked in at ${now.toLocaleTimeString()}${lateMinutes > 0 ? ` (${lateMinutes} mins late)` : ""}`,
      "attendance"
    );

    await logAudit(req, {
      action: "ATTENDANCE_CHECKIN",
      entity: "Attendance",
      entityId: attendance._id,
      details: {
        date: today,
        time: now.toISOString(),
        verificationMethod: attendance.verificationMethod,
        faceVerified: attendance.faceVerified,
        lateMinutes
      }
    });

    res.json({
      success: true,
      message: "Check-in recorded successfully",
      attendance
    });

  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// CHECK-OUT (Face Recognition or Location based)
//
export const checkOut = async (req, res) => {
  try {
    const today = getTodayDateString();
    const now = new Date();

    const {
      lat,
      lng,
      faceVerified = false,
      faceConfidence = 0
    } = req.body;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Office Location Check
    const office = await Location.findOne({ isActive: true });
    let distanceFromOffice = 0;

    if (office && lat && lng) {
      distanceFromOffice = getDistance(
        lat,
        lng,
        office.latitude,
        office.longitude
      );

      if (!faceVerified && distanceFromOffice > office.radius) {
        return res.status(400).json({
          success: false,
          message: `Outside allowed office area (Distance: ${Math.round(distanceFromOffice)}m, Radius: ${office.radius}m).`
        });
      }
    }

    // Find attendance record for today (or active open check-in within last 24h)
    let attendance = await Attendance.findOne({
      employee: req.user._id,
      $or: [
        { date: today, checkOut: null },
        { checkIn: { $gte: startOfDay, $lte: endOfDay }, checkOut: null },
        { checkIn: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, checkOut: null }
      ]
    }).sort({ createdAt: -1 });

    if (!attendance) {
      // Check if user already checked out today
      const alreadyCheckedOut = await Attendance.findOne({
        employee: req.user._id,
        $or: [
          { date: today },
          { checkIn: { $gte: startOfDay, $lte: endOfDay } }
        ],
        checkOut: { $ne: null }
      });

      if (alreadyCheckedOut) {
        return res.status(400).json({
          success: false,
          message: "You have already completed check-out for today."
        });
      }

      return res.status(400).json({
        success: false,
        message: "No active check-in record found. Please check in first."
      });
    }

    attendance.checkOut = now;
    attendance.checkOutLocation = { lat: lat || 0, lng: lng || 0 };

    if (faceVerified) {
      attendance.faceVerified = true;
      attendance.faceConfidence = Math.max(attendance.faceConfidence || 0, Number(faceConfidence) || 95);
    }

    // Total working hours calculation
    const hours = Math.max(0.1, (now - new Date(attendance.checkIn)) / (1000 * 60 * 60));
    attendance.totalHours = Number(hours.toFixed(2));
    attendance.workingHours = Number(hours.toFixed(2));

    // Early Departure Calculation
    const expectedEndStr = process.env.EXPECTED_END_TIME || "17:30";
    const expectedEndTime = getExpectedTime(expectedEndStr);

    if (now < expectedEndTime) {
      attendance.earlyLeaveMinutes = Math.round((expectedEndTime - now) / (1000 * 60));
    } else {
      attendance.earlyLeaveMinutes = 0;
    }

    // Attendance Status
    if (hours >= 7) {
      attendance.status = "present";
    } else if (hours >= 4) {
      attendance.status = "half-day";
    } else {
      attendance.status = "present";
    }

    // Overtime
    const standardHours = Number(process.env.STANDARD_WORK_HOURS) || 8;
    if (attendance.isHoliday || attendance.isSunday) {
      attendance.isOvertime = true;
      attendance.overtimeHours = Number(hours.toFixed(2));
    } else if (hours > standardHours) {
      attendance.isOvertime = true;
      attendance.overtimeHours = Number((hours - standardHours).toFixed(2));
    }

    await attendance.save();

    await createNotification(
      req.user._id,
      `Checked out at ${now.toLocaleTimeString()} (${attendance.workingHours} hrs worked)`,
      "attendance"
    );

    await logAudit(req, {
      action: "ATTENDANCE_CHECKOUT",
      entity: "Attendance",
      entityId: attendance._id,
      details: {
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: now.toISOString(),
        workingHours: attendance.workingHours,
        faceVerified: attendance.faceVerified
      }
    });

    res.json({
      success: true,
      message: "Check-out recorded successfully",
      attendance
    });

  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET MY ATTENDANCE
//
export const getMyAttendance = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = { employee: req.user._id };
    if (month) {
      filter.date = { $regex: month };
    }

    const data = await Attendance.find(filter).sort({ date: -1 });

    const totalDays = data.length;
    const presentDays = data.filter((a) => a.status === "present").length;
    const halfDays = data.filter((a) => a.status === "half-day").length;
    const absentDays = data.filter((a) => a.status === "absent").length;

    let totalOvertimeHours = 0;
    let totalWorkingHours = 0;

    data.forEach((item) => {
      totalWorkingHours += item.workingHours || item.totalHours || 0;
      if (item.isOvertime) {
        totalOvertimeHours += item.overtimeHours || 0;
      }
    });

    res.json({
      success: true,
      data,
      stats: {
        totalDays,
        presentDays,
        halfDays,
        absentDays,
        totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
        totalWorkingHours: Number(totalWorkingHours.toFixed(1))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// GET TODAY'S ATTENDANCE STATUS FOR CURRENT USER (Admin / Manager / Employee)
//
export const getMyTodayStatus = async (req, res) => {
  try {
    const today = getTodayDateString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const record = await Attendance.findOne({
      employee: req.user._id,
      $or: [
        { date: today },
        { checkIn: { $gte: startOfDay, $lte: endOfDay } }
      ]
    }).sort({ createdAt: -1 });

    if (!record || !record.checkIn) {
      return res.json({
        success: true,
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
        attendance: null
      });
    }

    const checkedOut = !!record.checkOut;
    return res.json({
      success: true,
      checkedIn: true,
      checkedOut,
      checkInTime: record.checkIn,
      checkOutTime: record.checkOut || null,
      workingHours: record.workingHours || record.totalHours || 0,
      attendance: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET ATTENDANCE REPORT WITH MULTI-CRITERIA FILTERS
//
export const getAttendanceReport = async (req, res) => {
  try {
    const {
      month,
      startDate,
      endDate,
      department,
      employee,
      status,
      verificationMethod,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    if (month) {
      filter.date = { $regex: month };
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (verificationMethod && verificationMethod !== "ALL") {
      filter.verificationMethod = verificationMethod;
    }

    if (employee && employee !== "ALL") {
      filter.employee = employee;
    }

    // Role-based scoping
    if (req.user.role === "manager") {
      const teamEmployees = await User.find({ department: req.user.department }).select("_id");
      const teamIds = teamEmployees.map((e) => e._id);
      filter.employee = { $in: teamIds };
    } else if (department && department !== "ALL") {
      const deptEmployees = await User.find({ department }).select("_id");
      const deptIds = deptEmployees.map((e) => e._id);
      filter.employee = { $in: deptIds };
    }

    // Search query on user name / email
    if (search && search.trim() !== "") {
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      const userIds = searchUsers.map((u) => u._id);
      if (filter.employee) {
        if (filter.employee.$in) {
          filter.employee.$in = filter.employee.$in.filter((id) => userIds.some((uid) => uid.equals(id)));
        }
      } else {
        filter.employee = { $in: userIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [attendanceList, total] = await Promise.all([
      Attendance.find(filter)
        .populate("employee", "name email department role")
        .populate("modifiedBy", "name email role")
        .sort({ date: -1, checkIn: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: attendanceList,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET ALL ATTENDANCE / ATTENDANCE DASHBOARD STATS
//
export const getAllAttendance = async (req, res) => {
  try {
    const { month, department } = req.query;

    const filter = {};
    if (month) filter.date = { $regex: month };

    if (department && department !== "ALL") {
      const users = await User.find({ department }).select("_id");
      filter.employee = { $in: users.map((u) => u._id) };
    }

    const data = await Attendance.find(filter)
      .populate("employee", "name email department")
      .sort({ date: -1 });

    const present = data.filter((a) => a.status === "present").length;
    const absent = data.filter((a) => a.status === "absent").length;
    const halfDay = data.filter((a) => a.status === "half-day").length;
    const lateCount = data.filter((a) => (a.lateMinutes || 0) > 0).length;

    let totalOvertime = 0;
    data.forEach((a) => {
      if (a.isOvertime) totalOvertime += a.overtimeHours || 0;
    });

    res.json({
      success: true,
      present,
      absent,
      halfDay,
      lateCount,
      totalOvertime: Number(totalOvertime.toFixed(1)),
      data
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Alias for getAttendanceDashboard
export const getAttendanceDashboard = getAllAttendance;


//
// MANUAL ATTENDANCE OVERRIDE (Admin & HR)
//
export const overrideAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      checkIn,
      checkOut,
      reason,
      notes
    } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A mandatory justification reason is required for manual attendance modification."
      });
    }

    const attendance = await Attendance.findById(id).populate("employee", "name email");

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    const previousState = {
      status: attendance.status,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      workingHours: attendance.workingHours
    };

    if (status) attendance.status = status;
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (notes) attendance.notes = notes;

    if (attendance.checkIn && attendance.checkOut) {
      const hours = Math.max(0, (new Date(attendance.checkOut) - new Date(attendance.checkIn)) / (1000 * 60 * 60));
      attendance.totalHours = Number(hours.toFixed(2));
      attendance.workingHours = Number(hours.toFixed(2));
    }

    attendance.modifiedBy = req.user._id;
    attendance.modificationReason = reason;
    attendance.verificationMethod = "admin";

    await attendance.save();

    await logAudit(req, {
      action: "ATTENDANCE_OVERRIDE",
      entity: "Attendance",
      entityId: attendance._id,
      details: {
        employeeName: attendance.employee?.name,
        previousState,
        newState: {
          status: attendance.status,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workingHours: attendance.workingHours
        },
        reason
      }
    });

    res.json({
      success: true,
      message: "Attendance successfully updated and logged to audit trail",
      attendance
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// CREATE MANUAL ATTENDANCE (Admin & HR Manager)
//
export const createManualAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      checkInTime,
      checkOutTime,
      status = "present",
      reason,
      notes = ""
    } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Date are required"
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A mandatory justification reason is required for manual attendance recording."
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Build Date objects for checkIn & checkOut if provided
    let checkInDate = null;
    let checkOutDate = null;
    let workingHours = 0;

    if (checkInTime) {
      const [inH, inM] = checkInTime.split(":").map(Number);
      checkInDate = new Date(`${date}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`);
    }

    if (checkOutTime) {
      const [outH, outM] = checkOutTime.split(":").map(Number);
      checkOutDate = new Date(`${date}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00`);
    }

    if (checkInDate && checkOutDate) {
      const diffHrs = Math.max(0, (checkOutDate - checkInDate) / (1000 * 60 * 60));
      workingHours = Number(diffHrs.toFixed(2));
    } else if (status === "present") {
      workingHours = 8;
    } else if (status === "half-day") {
      workingHours = 4;
    }

    // Check if record exists for this employee and date
    let attendance = await Attendance.findOne({ employee: employeeId, date });

    const isUpdate = !!attendance;
    if (attendance) {
      attendance.status = status;
      if (checkInDate) attendance.checkIn = checkInDate;
      if (checkOutDate) attendance.checkOut = checkOutDate;
      attendance.workingHours = workingHours;
      attendance.totalHours = workingHours;
      if (notes) attendance.notes = notes;
      attendance.verificationMethod = "admin";
      attendance.modificationReason = reason;
      attendance.modifiedBy = req.user._id;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status,
        workingHours,
        totalHours: workingHours,
        verificationMethod: "admin",
        notes,
        modificationReason: reason,
        modifiedBy: req.user._id
      });
    }

    await logAudit(req, {
      action: isUpdate ? "ATTENDANCE_MANUAL_UPDATE" : "ATTENDANCE_MANUAL_CREATE",
      entity: "Attendance",
      entityId: attendance._id,
      details: {
        employeeName: employee.name,
        date,
        status,
        workingHours,
        reason
      }
    });

    res.json({
      success: true,
      message: `Manual attendance for ${employee.name} on ${date} recorded successfully`,
      attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

