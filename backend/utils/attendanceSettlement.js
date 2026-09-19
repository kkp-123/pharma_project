import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import Leave from "../models/Leave.js";

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const settleMissedCheckoutsAndAbsents = async () => {
  try {
    const today = getTodayDateString();

    // 1. Find all open attendance records from past dates (checkIn exists, checkOut is null, date < today)
    const unclosedRecords = await Attendance.find({
      date: { $lt: today },
      checkIn: { $ne: null },
      checkOut: null
    });

    for (const record of unclosedRecords) {
      record.status = "absent";
      record.workingHours = 0;
      record.totalHours = 0;
      record.notes = record.notes
        ? `${record.notes} | Auto-marked Absent: Incomplete shift / missed Check-Out`
        : "Auto-marked Absent: Incomplete shift / missed Check-Out";
      await record.save();
    }

    // 2. Scan yesterday to ensure unrecorded active employees have an absent record
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yYear = yesterdayDate.getFullYear();
    const yMonth = String(yesterdayDate.getMonth() + 1).padStart(2, "0");
    const yDay = String(yesterdayDate.getDate()).padStart(2, "0");
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    const isYesterdaySunday = yesterdayDate.getDay() === 0;
    const isYesterdayHoliday = await Holiday.exists({ date: yesterdayStr });

    if (!isYesterdaySunday && !isYesterdayHoliday) {
      const activeEmployees = await User.find({
        role: { $in: ["employee", "manager"] },
        isActive: true
      });

      for (const emp of activeEmployees) {
        if (emp.joiningDate) {
          const joinStr = new Date(emp.joiningDate).toISOString().split("T")[0];
          if (joinStr > yesterdayStr) continue;
        }

        const existingAtt = await Attendance.findOne({ employee: emp._id, date: yesterdayStr });

        if (!existingAtt) {
          const hasLeave = await Leave.findOne({
            employee: emp._id,
            status: "approved",
            startDate: { $lte: yesterdayStr },
            endDate: { $gte: yesterdayStr }
          });

          if (!hasLeave) {
            await Attendance.create({
              employee: emp._id,
              date: yesterdayStr,
              status: "absent",
              verificationMethod: "admin",
              workingHours: 0,
              totalHours: 0,
              notes: "Auto-marked Absent: No check-in recorded for past working day"
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Attendance auto-settlement error:", error);
  }
};
