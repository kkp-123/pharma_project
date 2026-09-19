import { useEffect, useState } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import FaceAttendanceModal from "../../components/FaceAttendanceModal";
import {
  Clock,
  CalendarCheck,
  Percent,
  Briefcase,
  ScanFace,
  LogIn,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Layers,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1"];

const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Face Modal State
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState("checkin");

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    type: "casual",
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  /* Live Clock */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Fetch Employee Summary Data */
  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/employee/summary?month=${selectedMonth}`);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  /* Handle Face Attendance Button Click */
  const openFaceModal = (type) => {
    setAttendanceType(type);
    setFaceModalOpen(true);
  };

  /* Handle Apply Leave */
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      return toast.error("Please fill all required leave details");
    }

    try {
      setSubmittingLeave(true);
      await api.post("/leave/apply", leaveForm);
      toast.success("Leave application submitted successfully");
      setLeaveForm({ type: "casual", startDate: "", endDate: "", reason: "" });
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply for leave");
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your employee portal...</p>
        </div>
      </div>
    );
  }

  const user = data?.user || {};
  const today = data?.todayStatus || {};
  const stats = data?.stats || {};
  const recentAttendance = data?.recentAttendance || [];
  const leaves = data?.leaves || [];

  // Chart Data: Status Breakdown
  const statusPieData = [
    { name: "Present", value: stats.presentDays || 0 },
    { name: "Absent", value: stats.absentDays || 0 },
    { name: "Half Day", value: stats.halfDays || 0 }
  ].filter((d) => d.value > 0);

  // Chart Data: Working Hours per day
  const hoursChartData = recentAttendance.slice(0, 7).reverse().map((a) => ({
    date: a.date.slice(5),
    hours: a.workingHours || a.totalHours || 0,
    status: a.status
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles size={14} /> PharmaSys Employee Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user.name} 👋
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {user.department} Department • {user.email}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          <Clock className="text-indigo-400" size={24} />
          <div>
            <p className="text-base font-bold text-white font-mono">{time.toLocaleTimeString()}</p>
            <p className="text-[11px] text-slate-400">{time.toDateString()}</p>
          </div>
        </div>
      </div>

      {/* 2. Prominent Face Attendance Quick Action Bar */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="bg-slate-900/90 border border-indigo-500/30 p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
            <ScanFace size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              AI Face Recognition Attendance
              {user.faceData?.registered ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck size={12} /> Face Registered
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle size={12} /> Registration Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Mark your daily presence using facial identity & anti-spoofing verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {!today.checkedIn ? (
            <button
              onClick={() => openFaceModal("checkin")}
              className="flex-1 lg:flex-none px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <LogIn size={18} />
              Mark Face Check-In
            </button>
          ) : !today.checkedOut ? (
            <button
              onClick={() => openFaceModal("checkout")}
              className="flex-1 lg:flex-none px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={18} />
              Mark Face Check-Out
            </button>
          ) : (
            <div className="px-5 py-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Today's Attendance Completed ({today.workingHours} hrs)
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. Top KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Today's Status"
          value={today.status ? today.status.toUpperCase() : "NOT MARKED"}
          color={today.checkedIn ? "emerald" : "amber"}
          icon={<CalendarCheck size={18} />}
        />
        <KpiCard
          title="Check-In Time"
          value={today.checkInTime ? new Date(today.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          color="indigo"
          icon={<LogIn size={18} />}
          subtitle={today.lateMinutes > 0 ? `${today.lateMinutes}m late` : "On time"}
        />
        <KpiCard
          title="Check-Out Time"
          value={today.checkOutTime ? new Date(today.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          color="purple"
          icon={<LogOut size={18} />}
        />
        <KpiCard
          title="Working Hours"
          value={`${today.workingHours || 0} hrs`}
          color="blue"
          icon={<Clock size={18} />}
        />
        <KpiCard
          title="Attendance Rate"
          value={`${stats.attendancePercentage || 0}%`}
          color="emerald"
          icon={<Percent size={18} />}
        />
        <KpiCard
          title="Leave Balance"
          value={`${(user.leaveBalance?.casual || 0) + (user.leaveBalance?.sick || 0) + (user.leaveBalance?.paid || 0)} Days`}
          color="teal"
          icon={<Briefcase size={18} />}
          subtitle={`C: ${user.leaveBalance?.casual || 0} | S: ${user.leaveBalance?.sick || 0} | P: ${user.leaveBalance?.paid || 0}`}
        />
      </div>

      {/* 4. Charts & Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Working Hours Trend (Bar Chart) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Recent Working Hours Trend</h3>
              <p className="text-xs text-slate-400">Daily hours logged in current period</p>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-xl text-white outline-none"
            />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 12]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Attendance Distribution (Doughnut Chart) */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Attendance Breakdown</h3>
            <p className="text-xs text-slate-400">Present vs Absent vs Half Day</p>
          </div>

          <div className="h-52 my-2">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No attendance logs for this month
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
            <div>
              <p className="text-slate-400">Present</p>
              <p className="font-bold text-emerald-400 text-base">{stats.presentDays || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Absent</p>
              <p className="font-bold text-rose-400 text-base">{stats.absentDays || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Half Day</p>
              <p className="font-bold text-amber-400 text-base">{stats.halfDays || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Detailed Sections: Attendance Records & Apply Leave Form */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance History Table */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CalendarCheck size={18} className="text-indigo-400" />
              Recent Attendance Records
            </h3>
            <span className="text-xs text-slate-400">Last 10 records</span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-medium text-slate-200">{item.date}</td>
                      <td className="p-3 text-slate-300">
                        {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </td>
                      <td className="p-3 font-semibold text-indigo-300">{item.workingHours || item.totalHours || 0} hrs</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.verificationMethod === "face"
                            ? "bg-purple-900/30 text-purple-300 border border-purple-800"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {item.verificationMethod === "face" ? "👤 Face" : "📍 GPS"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "present"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : item.status === "half-day"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500">
                      No recent attendance logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply Leave & Leave Requests */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-1">
              <Briefcase size={18} className="text-emerald-400" />
              Apply for Leave
            </h3>
            <p className="text-xs text-slate-400">Submit leave requests to your department manager</p>
          </div>

          <form onSubmit={handleApplyLeave} className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Leave Type</label>
              <select
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
              >
                <option value="casual">Casual Leave ({user.leaveBalance?.casual || 0} remaining)</option>
                <option value="sick">Sick Leave ({user.leaveBalance?.sick || 0} remaining)</option>
                <option value="paid">Paid Vacation Leave ({user.leaveBalance?.paid || 0} remaining)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Reason</label>
              <input
                type="text"
                placeholder="Reason for leave..."
                required
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingLeave}
              className="sm:col-span-2 mt-1 py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-xs text-white shadow transition disabled:opacity-50"
            >
              {submittingLeave ? "Submitting Application..." : "Submit Leave Application"}
            </button>
          </form>

          {/* Recent Leave Requests mini table */}
          {leaves.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Your Leave Status</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {leaves.map((l) => (
                  <div key={l._id} className="p-2.5 bg-slate-950/60 rounded-xl flex justify-between items-center text-xs border border-slate-800/80">
                    <div>
                      <p className="font-semibold text-slate-200 capitalize">{l.type} Leave</p>
                      <p className="text-[10px] text-slate-400">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : l.status === "rejected" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {l.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Face Attendance Modal */}
      <FaceAttendanceModal
        isOpen={faceModalOpen}
        type={attendanceType}
        onClose={() => setFaceModalOpen(false)}
        onSuccess={(resData) => {
          setFaceModalOpen(false);
          if (resData?.attendance) {
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                todayStatus: {
                  ...prev.todayStatus,
                  checkedIn: true,
                  checkInTime: resData.attendance.checkIn || prev.todayStatus?.checkInTime || new Date().toISOString(),
                  checkedOut: !!resData.attendance.checkOut,
                  checkOutTime: resData.attendance.checkOut || null,
                  workingHours: resData.attendance.workingHours || resData.attendance.totalHours || 0,
                  status: resData.attendance.status || "present"
                }
              };
            });
          }
          fetchSummary();
        }}
      />
    </div>
  );
};

/* Reusable KPI Card */
const KpiCard = ({ title, value, color = "indigo", icon, subtitle }) => {
  const colorMap = {
    indigo: "border-indigo-500/20 bg-indigo-950/10 text-indigo-400",
    emerald: "border-emerald-500/20 bg-emerald-950/10 text-emerald-400",
    rose: "border-rose-500/20 bg-rose-950/10 text-rose-400",
    amber: "border-amber-500/20 bg-amber-950/10 text-amber-400",
    purple: "border-purple-500/20 bg-purple-950/10 text-purple-400",
    teal: "border-teal-500/20 bg-teal-950/10 text-teal-400",
    blue: "border-blue-500/20 bg-blue-950/10 text-blue-400"
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`p-4 rounded-2xl bg-slate-900/80 border shadow-lg flex flex-col justify-between ${colorMap[color] || colorMap.indigo}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-[11px] font-medium truncate">{title}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <div>
        <h4 className="text-lg sm:text-xl font-extrabold text-white">{value}</h4>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default EmployeeDashboard;