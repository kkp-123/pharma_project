import Salary from "../models/Salary.js";
import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import Bonus from "../models/Bonus.js";
import Leave from "../models/Leave.js";
import { createNotification } from "./notificationController.js";
import { logAudit } from "../utils/auditLogger.js";

//
// HELPER: Real-World Industrial CTC Salary Engine
//
export const calculateEmployeeSalary = async (user, month, customPf, customTax) => {
  const base = user.salary || 30000;

  // Real-world corporate salary structure
  const basicPay = Math.round(base * 0.50);
  const hra = Math.round(basicPay * 0.40);
  const da = Math.round(basicPay * 0.20);
  const specialAllowance = Math.max(0, base - basicPay - hra - da);
  const grossSalary = base;

  const [year, m] = month.split("-");
  const totalDays = new Date(year, m, 0).getDate();

  // Holidays in selected month
  const holidays = await Holiday.find({ date: { $regex: month } });
  const holidayDates = holidays.map((h) => h.date);

  let workingDays = 0;
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, m - 1, i);
    const day = d.getDay();
    const formatted = `${year}-${m}-${String(i).padStart(2, "0")}`;

    if (day !== 0 && !holidayDates.includes(formatted)) {
      workingDays++;
    }
  }

  if (workingDays === 0) workingDays = 26;

  // Actual Attendance Records
  const records = await Attendance.find({
    employee: user._id,
    date: { $regex: month }
  });

  let present = 0;
  let half = 0;
  let overtimeHours = 0;

  records.forEach((r) => {
    if (r.status === "present") present++;
    if (r.status === "half-day") half++;
    if (r.isOvertime) overtimeHours += r.overtimeHours || 0;
  });

  // Approved Leaves
  const leaves = await Leave.find({
    employee: user._id,
    status: "approved",
    startDate: { $lte: `${month}-31` },
    endDate: { $gte: `${month}-01` }
  });

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  leaves.forEach((l) => {
    const days = Math.round((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (l.isPaid) {
      paidLeaveDays += days;
    } else {
      unpaidLeaveDays += days;
    }
  });

  // Real-time pro-rata calculation
  const effectiveDays = present + half * 0.5 + paidLeaveDays;
  const absentDays = Math.max(0, workingDays - (effectiveDays + unpaidLeaveDays));

  const perDayGross = grossSalary / workingDays;
  const attendanceDeduction = Math.round(absentDays * perDayGross);

  // Bonus
  const bonusData = await Bonus.findOne({
    employee: user._id,
    month,
    isPaid: false
  });
  const bonus = bonusData ? bonusData.amount : 0;

  // Overtime Pay
  const overtimeRate = user.overtimeRate || Math.round((perDayGross / 8) * 1.5);
  const overtimePay = Math.round(overtimeHours * overtimeRate);

  // Deductions
  const pfDeduction = customPf !== undefined && customPf !== "" ? Number(customPf) : Math.round(basicPay * 0.12);
  const taxDeduction = customTax !== undefined && customTax !== "" ? Number(customTax) : (base > 50000 ? Math.round(base * 0.05) : 0);

  const totalDeductions = attendanceDeduction + pfDeduction + taxDeduction;
  const netSalary = Math.max(0, Math.round(grossSalary + overtimePay + bonus - totalDeductions));

  const payslipNumber = `PAY-${year}${m}-${user._id.toString().slice(-4).toUpperCase()}`;

  return {
    employee: user._id,
    month,
    payslipNumber,
    baseSalary: base,
    basicPay,
    hra,
    da,
    specialAllowance,
    grossSalary,
    workingDays,
    presentDays: present,
    halfDays: half,
    paidLeaveDays,
    unpaidLeaveDays,
    absentDays,
    bonus,
    overtimeHours,
    overtimeRate,
    overtime: overtimePay,
    pf: pfDeduction,
    tax: taxDeduction,
    attendanceDeduction,
    totalDeductions,
    netSalary,
    bonusData
  };
};


//
// PREVIEW SALARY CALCULATION (Real-Time Corporate Extended)
//
export const previewSalaryCalculation = async (req, res) => {
  try {
    const { employeeId, month, pf, tax } = req.body;

    if (!employeeId || !month) {
      return res.status(400).json({ success: false, message: "Employee ID and Month are required" });
    }

    const user = await User.findById(employeeId);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: "Employee not found or inactive" });
    }

    const calculation = await calculateEmployeeSalary(user, month, pf, tax);
    delete calculation.bonusData;

    res.json({
      success: true,
      data: { ...calculation, employeeName: user.name, employeeEmail: user.email, department: user.department }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//
// GENERATE / RECALCULATE INDIVIDUAL CORPORATE SALARY
//
export const generateSalary = async (req, res) => {
  try {
    const { employeeId, month, pf, tax } = req.body;

    if (!employeeId || !month) {
      return res.status(400).json({ success: false, message: "Employee ID and Month are required" });
    }

    const user = await User.findById(employeeId);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: "Employee not found or inactive" });
    }

    const calculation = await calculateEmployeeSalary(user, month, pf, tax);
    const bonusData = calculation.bonusData;
    delete calculation.bonusData;

    // Upsert Salary document in DB
    let salary = await Salary.findOne({ employee: employeeId, month });

    if (salary) {
      Object.assign(salary, calculation);
      await salary.save();
    } else {
      salary = await Salary.create(calculation);
    }

    // Mark bonus as paid if applicable
    if (bonusData) {
      bonusData.isPaid = true;
      await bonusData.save();
    }

    // Notification to employee
    await createNotification(
      employeeId,
      `Corporate payroll salary slip for ${month} generated (Net: ₹${salary.netSalary.toLocaleString()})`,
      "salary"
    );

    await logAudit(req, {
      action: "SALARY_GENERATED",
      entity: "Salary",
      entityId: salary._id,
      details: {
        employee: user.name,
        month,
        grossSalary: salary.grossSalary,
        netSalary: salary.netSalary
      }
    });

    res.json({
      success: true,
      message: `Salary for ${user.name} (${month}) calculated & generated successfully`,
      salary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//
// GENERATE Salaries for All Employees (Bulk 1-Click Processing)
//
export const generateAllSalaries = async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: "Month is required" });
    }

    const users = await User.find({
      role: { $in: ["employee", "manager"] },
      isActive: true
    });

    let generatedCount = 0;

    for (const user of users) {
      const calculation = await calculateEmployeeSalary(user, month);
      const bonusData = calculation.bonusData;
      delete calculation.bonusData;

      let salary = await Salary.findOne({ employee: user._id, month });
      if (salary) {
        Object.assign(salary, calculation);
        await salary.save();
      } else {
        await Salary.create(calculation);
      }

      if (bonusData) {
        bonusData.isPaid = true;
        await bonusData.save();
      }
      generatedCount++;
    }

    await logAudit(req, {
      action: "BULK_SALARY_GENERATED",
      entity: "Salary",
      details: { month, count: generatedCount }
    });

    res.json({
      success: true,
      message: `Successfully generated ${generatedCount} corporate salaries for ${month}`,
      generatedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//
// MARK SALARY (SINGLE / BULK) AS PAID
//
export const markSalaryPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "bank_transfer" } = req.body;

    const salary = await Salary.findById(id).populate("employee", "name email");

    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    salary.isPaid = true;
    salary.paidAt = new Date();
    salary.paymentMethod = paymentMethod;
    await salary.save();

    await createNotification(
      salary.employee?._id || salary.employee,
      `Your salary for ${salary.month} (Net: ₹${salary.netSalary.toLocaleString()}) was disbursed via ${paymentMethod}`,
      "salary"
    );

    res.json({
      success: true,
      message: "Salary successfully disbursed",
      salary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const bulkMarkSalariesPaid = async (req, res) => {
  try {
    const { month, paymentMethod = "bank_transfer" } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: "Month is required" });
    }

    const updatedRes = await Salary.updateMany(
      { month, isPaid: false },
      { $set: { isPaid: true, paidAt: new Date(), paymentMethod } }
    );

    res.json({
      success: true,
      message: `Successfully disbursed ${updatedRes.modifiedCount} salaries for ${month}`,
      modifiedCount: updatedRes.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//
// GET MY SALARIES (Personal Payslips)
//
export const getMySalary = async (req, res) => {
  try {
    const salaries = await Salary.find({ employee: req.user._id })
      .sort({ month: -1 })
      .populate("employee", "name email department role joiningDate");

    res.json({
      success: true,
      count: salaries.length,
      salaries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET ALL SALARIES (Admin / HR Manager)
//
export const getAllSalaries = async (req, res) => {
  try {
    const { month = new Date().toISOString().slice(0, 7), department, isPaid } = req.query;

    const userFilter = {
      role: { $in: ["employee", "manager"] },
      isActive: true
    };
    if (department && department !== "ALL") {
      userFilter.department = department;
    }

    const users = await User.find(userFilter).select("name email department role salary joiningDate isActive").sort({ name: 1 });
    const salaryFilter = { month };
    if (isPaid !== undefined && isPaid !== "ALL") {
      salaryFilter.isPaid = isPaid === "true";
    }
    const salaries = await Salary.find(salaryFilter).populate("employee", "name email department role salary");

    let totalPayrollCost = 0;
    let totalDisbursed = 0;
    let totalPending = 0;
    let generated = 0;
    let paidCount = 0;

    const roster = users.map((u) => {
      const salaryRecord = salaries.find((s) => String(s.employee?._id || s.employee) === String(u._id));
      const status = salaryRecord ? (salaryRecord.isPaid ? "PAID" : "GENERATED") : "NOT_GENERATED";

      if (salaryRecord) {
        generated++;
        totalPayrollCost += salaryRecord.netSalary || salaryRecord.grossSalary || 0;
        if (salaryRecord.isPaid) {
          paidCount++;
          totalDisbursed += salaryRecord.netSalary || 0;
        } else {
          totalPending += salaryRecord.netSalary || 0;
        }
      }

      return {
        user: u,
        salaryRecord: salaryRecord || null,
        status
      };
    });

    res.json({
      success: true,
      month,
      stats: {
        totalEmployees: users.length,
        generated,
        paidCount,
        totalPayrollCost,
        totalDisbursed,
        totalPending
      },
      salaries: roster
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// SALARY_STATUS_BY_MONTH (For Roster / List View)
//
export const getSalaryStatusByMonth = async (req, res) => {
  try {
    const { month, department } = req.query;

    if (!month) {
      return res.status(400).json({ success: false, message: "Month is required" });
    }

    const userFilter = {
      role: { $in: ["employee", "manager"] },
      isActive: true
    };
    if (department && department !== "ALL") {
      userFilter.department = department;
    }

    const users = await User.find(userFilter).sort({ name: 1 });
    const salaries = await Salary.find({ month });

    const data = users.map((user) => {
      const salary = salaries.find((s) => String(s.employee) === String(user._id));
      return {
        user,
        salaryExists: !!salary,
        isPaid: salary?.isPaid || false,
        salary: salary || null
      };
    });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
