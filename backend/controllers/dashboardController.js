import User from "../models/User.js";
import Product from "../models/Product.js";
import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import Inventory from "../models/Inventory.js";
import Batch from "../models/Batch.js";
import QC from "../models/QC.js";
import Sale from "../models/Sales.js";
import Salary from "../models/Salary.js";

//
// ADMIN & GLOBAL DASHBOARD STATS (Live database data)
//
export const getDashboardStats = async (req, res) => {
  try {
    const { department, startDate, endDate } = req.query;

    const userFilter = {};
    if (department && department !== "ALL") {
      userFilter.department = department;
    }

    const today = new Date().toISOString().split("T")[0];

    // Employee & Manager Counts
    const totalEmployees = await User.countDocuments({ role: "employee", ...userFilter });
    const totalManagers = await User.countDocuments({ role: "manager", ...userFilter });
    const activeEmployees = await User.countDocuments({ role: "employee", isActive: true, ...userFilter });
    const inactiveEmployees = await User.countDocuments({ role: "employee", isActive: false, ...userFilter });
    const faceRegisteredCount = await User.countDocuments({ "faceData.registered": true, ...userFilter });

    const totalProducts = await Product.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: "pending" });

    // Today's Attendance Counts
    let todayAttFilter = { date: today };
    if (department && department !== "ALL") {
      const deptUsers = await User.find({ department }).select("_id");
      todayAttFilter.employee = { $in: deptUsers.map((u) => u._id) };
    }

    const todayRecords = await Attendance.find(todayAttFilter);
    const present = todayRecords.filter((r) => r.status === "present").length;
    const absent = todayRecords.filter((r) => r.status === "absent").length;
    const halfDay = todayRecords.filter((r) => r.status === "half-day").length;
    const lateEmployees = todayRecords.filter((r) => (r.lateMinutes || 0) > 0).length;

    // Active leaves today
    const leavesToday = await Leave.countDocuments({
      status: "approved",
      startDate: { $lte: new Date(today + "T23:59:59.999Z") },
      endDate: { $gte: new Date(today + "T00:00:00.000Z") }
    });

    // Inventory & Batch Alerts
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);

    const expiringBatches = await Inventory.countDocuments({
      expiryDate: { $lte: next30, $gte: new Date() }
    });

    const lowStockAgg = await Inventory.aggregate([
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "prod"
        }
      },
      { $unwind: "$prod" },
      {
        $match: {
          $expr: { $lt: ["$totalQuantity", 100] } // low stock threshold
        }
      }
    ]);
    const lowStockProducts = lowStockAgg.length;

    // QC Alerts
    const pendingQC = await Batch.countDocuments({ status: "pending" });
    const passedQC = await QC.countDocuments({ result: "pass" });
    const failedQC = await QC.countDocuments({ result: "fail" });

    // Sales Revenue
    const salesAgg = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalSales: { $sum: 1 }
        }
      }
    ]);
    const totalRevenue = salesAgg[0]?.totalRevenue || 0;
    const totalSales = salesAgg[0]?.totalSales || 0;

    // Department Distribution
    const departments = await User.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      totalEmployees,
      totalManagers,
      totalDepartments: departments.length,
      activeEmployees,
      inactiveEmployees,
      faceRegisteredCount,
      totalProducts,
      pendingLeaves,
      present,
      absent,
      halfDay,
      lateEmployees,
      employeesOnLeave: leavesToday,
      lowStockProducts,
      expiringBatches,
      pendingQC,
      passedQC,
      failedQC,
      totalRevenue,
      totalSales,
      departments
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//
// ADVANCED ADMIN & GLOBAL CHARTS (Interactive aggregation)
//
export const getDashboardCharts = async (req, res) => {
  try {
    const { department, month, startDate, endDate } = req.query;

    const currentMonth = month || new Date().toISOString().slice(0, 7);

    // 1. Employees by Department & Role
    const employeeByDept = await User.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { department: "$_id", count: 1, _id: 0 } }
    ]);

    const employeeByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { role: "$_id", count: 1, _id: 0 } }
    ]);

    // 2. Attendance Trends (Daily in Current Month)
    let attMatch = { date: { $regex: currentMonth } };
    if (department && department !== "ALL") {
      const deptUsers = await User.find({ department }).select("_id");
      attMatch.employee = { $in: deptUsers.map((u) => u._id) };
    }

    const attendanceTrend = await Attendance.aggregate([
      { $match: attMatch },
      {
        $group: {
          _id: "$date",
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $gt: ["$lateMinutes", 0] }, 1, 0] } },
          overtimeHours: { $sum: "$overtimeHours" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Department Attendance Comparison
    const departmentAttendance = await Attendance.aggregate([
      { $match: { date: { $regex: currentMonth } } },
      {
        $lookup: {
          from: "users",
          localField: "employee",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.department",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } }
        }
      }
    ]);

    // 4. Leave Analytics (By Status and Type)
    const leaveByStatus = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const leaveByType = await Leave.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    // 5. QC Pass vs Fail
    const qcResults = await QC.aggregate([
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 }
        }
      }
    ]);

    // 6. Inventory Stock by Product
    const inventoryStock = await Inventory.aggregate([
      {
        $group: {
          _id: "$product",
          quantity: { $sum: "$quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          productName: "$product.name",
          quantity: 1,
          _id: 0
        }
      },
      { $limit: 10 }
    ]);

    // 7. Salary Expense by Department
    const salaryCostByDept = await User.aggregate([
      {
        $group: {
          _id: "$department",
          totalSalary: { $sum: "$salary" },
          employeeCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      employeeByDept,
      employeeByRole,
      attendanceTrend,
      departmentAttendance,
      leaveByStatus,
      leaveByType,
      qcResults,
      inventoryStock,
      salaryCostByDept
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// DEPARTMENT MANAGER SUMMARY API
//
export const getManagerSummary = async (req, res) => {
  try {
    const department = req.user.role === "admin" && req.query.department
      ? req.query.department
      : req.user.department;

    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];

    // Team Members
    const teamMembers = await User.find({
      department,
      isActive: true
    }).select("_id name email phone joiningDate salary faceData.registered");

    const teamIds = teamMembers.map((u) => u._id);

    // Today Attendance
    const todayAttendance = await Attendance.find({
      employee: { $in: teamIds },
      date: today
    }).populate("employee", "name email");

    const presentToday = todayAttendance.filter((r) => r.status === "present").length;
    const halfDayToday = todayAttendance.filter((r) => r.status === "half-day").length;
    const lateToday = todayAttendance.filter((r) => (r.lateMinutes || 0) > 0).length;
    const absentToday = Math.max(0, teamMembers.length - (presentToday + halfDayToday));

    // Pending Leaves for this manager
    const pendingLeaves = await Leave.find({
      manager: req.user._id,
      status: "pending"
    }).populate("employee", "name email department");

    // Monthly Attendance for team
    const monthlyAttendance = await Attendance.find({
      employee: { $in: teamIds },
      date: { $regex: month }
    }).populate("employee", "name email");

    const totalOvertimeHours = monthlyAttendance.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

    // Department Specific Metrics
    let departmentSpecific = {};

    if (department === "HR") {
      const allUsers = await User.find().select("department role isActive faceData.registered salary");
      departmentSpecific = {
        totalEmployees: allUsers.filter((u) => u.role === "employee").length,
        totalManagers: allUsers.filter((u) => u.role === "manager").length,
        faceRegisteredTotal: allUsers.filter((u) => u.faceData?.registered).length,
        totalSalaryExpense: allUsers.reduce((acc, u) => acc + (u.salary || 0), 0)
      };
    } else if (department === "QC") {
      const pendingBatches = await Batch.find({ status: "pending" }).populate("product", "name");
      const passedCount = await QC.countDocuments({ result: "pass" });
      const failedCount = await QC.countDocuments({ result: "fail" });
      departmentSpecific = {
        pendingBatches,
        passedCount,
        failedCount
      };
    } else if (department === "Production") {
      const activeBatches = await Batch.find({ status: "pending" }).populate("product", "name");
      const approvedBatches = await Batch.find({ status: "approved" }).countDocuments();
      departmentSpecific = {
        activeBatches,
        approvedBatches
      };
    } else if (department === "Inventory") {
      const next30 = new Date();
      next30.setDate(next30.getDate() + 30);
      const expiringStock = await Inventory.find({ expiryDate: { $lte: next30, $gte: new Date() } })
        .populate("product", "name")
        .populate("batch", "batchNumber");
      const totalStock = await Inventory.aggregate([
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]);
      departmentSpecific = {
        expiringStock,
        totalStock: totalStock[0]?.total || 0
      };
    } else if (department === "Sales") {
      const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(5);
      const salesStats = await Sale.aggregate([
        { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" }, dueAmount: { $sum: "$dueAmount" } } }
      ]);
      departmentSpecific = {
        recentSales,
        totalSales: salesStats[0]?.totalSales || 0,
        totalRevenue: salesStats[0]?.totalRevenue || 0,
        dueAmount: salesStats[0]?.dueAmount || 0
      };
    }

    res.json({
      success: true,
      department,
      month,
      teamSize: teamMembers.length,
      teamMembers,
      presentToday,
      absentToday,
      halfDayToday,
      lateToday,
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
      pendingLeaves,
      todayAttendance,
      monthlyAttendance,
      departmentSpecific
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// EMPLOYEE DASHBOARD SUMMARY API
//
export const getEmployeeSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const user = await User.findById(userId)
      .select("-password -faceData.descriptor")
      .populate("manager", "name email department");

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      employee: userId,
      $or: [
        { date: today },
        { checkIn: { $gte: startOfDay, $lte: endOfDay } },
        { checkIn: { $gte: new Date(Date.now() - 20 * 60 * 60 * 1000) }, checkOut: null }
      ]
    }).sort({ createdAt: -1 });

    // Monthly attendance
    const monthlyAttendance = await Attendance.find({
      employee: userId,
      $or: [
        { date: { $regex: month } },
        { checkIn: { $gte: new Date(month + "-01T00:00:00.000Z") } }
      ]
    }).sort({ date: -1, createdAt: -1 });

    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let totalWorkingHours = 0;
    let overtimeHours = 0;

    monthlyAttendance.forEach((r) => {
      if (r.status === "present") presentDays++;
      if (r.status === "absent") absentDays++;
      if (r.status === "half-day") halfDays++;
      if ((r.lateMinutes || 0) > 0) lateDays++;
      totalWorkingHours += r.workingHours || r.totalHours || 0;
      if (r.isOvertime) overtimeHours += r.overtimeHours || 0;
    });

    const totalDaysRecorded = presentDays + halfDays + absentDays;
    const attendancePercentage = totalDaysRecorded > 0
      ? Number(((presentDays + halfDays * 0.5) / totalDaysRecorded * 100).toFixed(1))
      : 0;

    // Leaves
    const leaves = await Leave.find({ employee: userId }).sort({ createdAt: -1 });
    const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

    // Salary (Latest generated)
    const latestSalary = await Salary.findOne({ employee: userId }).sort({ month: -1 });

    res.json({
      success: true,
      user,
      todayStatus: {
        checkedIn: !!todayAttendance?.checkIn,
        checkInTime: todayAttendance?.checkIn || null,
        checkedOut: !!todayAttendance?.checkOut,
        checkOutTime: todayAttendance?.checkOut || null,
        workingHours: todayAttendance?.workingHours || todayAttendance?.totalHours || 0,
        lateMinutes: todayAttendance?.lateMinutes || 0,
        status: todayAttendance?.status || "Not marked",
        faceVerified: !!todayAttendance?.faceVerified
      },
      stats: {
        presentDays,
        absentDays,
        halfDays,
        lateDays,
        totalWorkingHours: Number(totalWorkingHours.toFixed(1)),
        averageWorkingHours: totalDaysRecorded > 0 ? Number((totalWorkingHours / totalDaysRecorded).toFixed(1)) : 0,
        overtimeHours: Number(overtimeHours.toFixed(1)),
        attendancePercentage,
        leaveBalance: user.leaveBalance || { casual: 0, sick: 0, paid: 0 },
        pendingLeaves
      },
      recentAttendance: monthlyAttendance.slice(0, 10),
      leaves: leaves.slice(0, 5),
      latestSalary
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};