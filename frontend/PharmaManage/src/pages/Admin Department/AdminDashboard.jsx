import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../Socket.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import FaceAttendanceModal from "../../components/FaceAttendanceModal";

import {
  Users,
  UserCheck,
  UserX,
  Package,
  CalendarCheck,
  Clock,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Beaker,
  Filter,
  RefreshCw,
  Building2,
  ScanFace,
  DollarSign,
  Layers,
  ChevronRight,
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attendance Modal States
  const [faceAttendanceOpen, setFaceAttendanceOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState("checkin");
  const [myAttendanceStatus, setMyAttendanceStatus] = useState({
    checkedIn: false,
    checkedOut: false,
    checkInTime: null,
    checkOutTime: null,
    workingHours: 0
  });

  // Global Dashboard Filters
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const query = `?department=${departmentFilter}&month=${selectedMonth}`;

      const [statsRes, chartsRes, attendanceStatusRes, forecastRes] = await Promise.all([
        api.get(`/admin/dashboard-stats${query}`),
        api.get(`/admin/dashboard-charts${query}`),
        api.get("/attendance/today-status").catch(() => ({ data: { checkedIn: false, checkedOut: false } })),
        api.get("/forecast/sales-next-month").catch(() => ({ data: null }))
      ]);

      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setMyAttendanceStatus(attendanceStatusRes.data || { checkedIn: false, checkedOut: false });
      setForecastData(forecastRes.data);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
      toast.error("Failed to load admin analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    socket.on("attendanceUpdated", fetchDashboardData);
    socket.on("newNotification", fetchDashboardData);

    return () => {
      socket.off("attendanceUpdated", fetchDashboardData);
      socket.off("newNotification", fetchDashboardData);
    };
  }, [departmentFilter, selectedMonth]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading enterprise analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // Format charts data
  const employeeByDept = charts?.employeeByDept || [];
  const employeeByRole = charts?.employeeByRole || [];
  const attendanceTrend = (charts?.attendanceTrend || []).map((d) => ({
    ...d,
    date: d._id?.slice(5) || d._id
  }));
  const departmentAttendance = (charts?.departmentAttendance || []).map((d) => ({
    department: d._id,
    present: d.present,
    absent: d.absent,
    halfDay: d.halfDay
  }));
  const qcResults = (charts?.qcResults || []).map((d) => ({
    name: d._id === "pass" ? "Passed" : "Failed",
    value: d.count
  }));
  const inventoryStock = charts?.inventoryStock || [];
  const salaryCostByDept = (charts?.salaryCostByDept || []).map((d) => ({
    department: d._id,
    totalSalary: d.totalSalary,
    employeeCount: d.employeeCount
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header & Global Filters Bar */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 size={14} /> Pharmaceutical Enterprise Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Admin Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time aggregate data across all operations, biometric attendance, QC, and warehouse inventory.
          </p>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <Filter size={14} /> Filter:
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="HR">HR Department</option>
            <option value="QC">QC Department</option>
            <option value="Production">Production</option>
            <option value="Inventory">Inventory</option>
            <option value="Sales">Sales</option>
          </select>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
          />

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>

          {!myAttendanceStatus?.checkedIn ? (
            <button
              onClick={() => {
                setAttendanceType("checkin");
                setFaceAttendanceOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <LogIn size={15} /> Check-In (Face)
            </button>
          ) : !myAttendanceStatus?.checkedOut ? (
            <button
              onClick={() => {
                setAttendanceType("checkout");
                setFaceAttendanceOpen(true);
              }}
              title={`Checked in at ${myAttendanceStatus.checkInTime ? new Date(myAttendanceStatus.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}
              className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition animate-pulse"
            >
              <LogOut size={15} /> Check-Out (Face)
            </button>
          ) : (
            <div className="px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold rounded-xl text-xs flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" />
              Checked Out ({myAttendanceStatus.workingHours}h)
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Employees" value={stats?.totalEmployees || 0} icon={<Users size={18} />} color="indigo" subtitle={`Active: ${stats?.activeEmployees || 0}`} />
        <KpiCard title="Managers" value={stats?.totalManagers || 0} icon={<UserCheck size={18} />} color="teal" subtitle={`${stats?.totalDepartments || 5} Departments`} />
        <KpiCard title="Face Registered" value={stats?.faceRegisteredCount || 0} icon={<ScanFace size={18} />} color="purple" subtitle="Biometric Templates" />
        <KpiCard title="Present Today" value={stats?.present || 0} icon={<CalendarCheck size={18} />} color="emerald" subtitle={`Late: ${stats?.lateEmployees || 0}`} />
        <KpiCard title="Absent Today" value={stats?.absent || 0} icon={<AlertCircle size={18} />} color="rose" subtitle={`On Leave: ${stats?.employeesOnLeave || 0}`} />
        <KpiCard title="Pending Leaves" value={stats?.pendingLeaves || 0} icon={<Briefcase size={18} />} color="amber" subtitle="Awaiting Manager Action" />

        <KpiCard title="Total Products" value={stats?.totalProducts || 0} icon={<Package size={18} />} color="blue" subtitle="Formulations" />
        <KpiCard title="Low Stock Alerts" value={stats?.lowStockProducts || 0} icon={<AlertCircle size={18} />} color="rose" subtitle="Below Threshold" />
        <KpiCard title="Expiring Batches" value={stats?.expiringBatches || 0} icon={<Clock size={18} />} color="amber" subtitle="Within 30 Days" />
        <KpiCard title="Pending QC" value={stats?.pendingQC || 0} icon={<Beaker size={18} />} color="purple" subtitle="Batches in Queue" />
        <KpiCard title="QC Passed Batches" value={stats?.passedQC || 0} icon={<CheckCircle2 size={18} />} color="emerald" subtitle="Released to Inventory" />
        <KpiCard title="Total Sales Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign size={18} />} color="emerald" subtitle={`${stats?.totalSales || 0} Orders`} />
      </div>

      {/* Predictive AI Sales & Market Demand Forecast Card */}
      {forecastData && (
        <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/30 p-6 sm:p-7 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles size={16} /> Enterprise Predictive Analytics Engine
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Next-Month Projected Revenue:{" "}
                <span className="text-emerald-400">
                  ₹{Number(forecastData.predictedRevenue ?? 0).toLocaleString()}
                </span>
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                Forecast for {forecastData.forecastMonth || "Next Month"} • Growth:{" "}
                <span className={forecastData.projectedGrowthPercent >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {forecastData.projectedGrowthPercent > 0 ? "+" : ""}{forecastData.projectedGrowthPercent || 0}%
                </span>{" "}
                vs Last Month (₹{Number(forecastData.lastMonthRevenue ?? 0).toLocaleString()})
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-slate-900/90 border border-slate-700/60 px-4 py-2.5 rounded-2xl text-center">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Projected Volume</p>
                <h4 className="text-base font-bold text-indigo-400">
                  {Number(forecastData.productForecasts?.reduce((s, p) => s + Number(p.predictedDemandQuantity ?? 0), 0) ?? 0).toLocaleString()} Units
                </h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {forecastData.productForecasts?.slice(0, 4).map((p) => (
              <div key={p.productId} className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                <p className="font-bold text-xs text-white truncate">{p.productName}</p>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>Stock:</span>
                  <span className={p.currentInventoryStock < p.predictedDemandQuantity ? "text-rose-400 font-bold" : "text-emerald-400"}>
                    {Number(p.currentInventoryStock ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>Predicted Demand:</span>
                  <span className="font-bold text-indigo-400">{Number(p.predictedDemandQuantity ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>Target Mfg Batch:</span>
                  <span className="font-bold text-amber-400">+{Number(p.recommendedProductionUnits ?? 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Primary Charts Section: Attendance Trends & Department Distribution */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Daily Trend (Multi-Line Chart) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Daily Attendance Trend</h3>
              <p className="text-xs text-slate-400">Present, Absent, Half-Day & Late trends for {selectedMonth}</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2.5} name="Present" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="halfDay" stroke="#f59e0b" strokeWidth={2} name="Half Day" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="late" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" name="Late Arrival" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employees by Department (Pie Chart) */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Department Workforce</h3>
            <p className="text-xs text-slate-400">Employee distribution across units</p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={employeeByDept}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="department"
                >
                  {employeeByDept.map((entry, index) => (
                    <Cell key={`dept-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#cbd5e1" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 text-center">
            Total Workforce: <span className="font-bold text-white">{stats?.totalEmployees || 0}</span> employees
          </div>
        </div>
      </div>

      {/* 4. Secondary Analytics Section: Department Attendance & QC Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Attendance Comparison (Bar Chart) */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Department Attendance Comparison</h3>
            <p className="text-xs text-slate-400">Present vs Absent volume per department</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentAttendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="present" fill="#10b981" name="Present" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Stock by Top Products (Bar Chart) */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Warehouse Stock by Product</h3>
            <p className="text-xs text-slate-400">Current available inventory levels (Units)</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryStock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="productName" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                <Bar dataKey="quantity" fill="#6366f1" name="Units Available" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tertiary Analytics: Salary Costs & QC Pass/Fail */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Department Salary Distribution */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Department Salary Cost</h3>
            <p className="text-xs text-slate-400">Total monthly payroll commitment per department</p>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryCostByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(val) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                />
                <Bar dataKey="totalSalary" fill="#06b6d4" name="Payroll Cost (₹)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* QC Results Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Quality Inspection Ratio</h3>
            <p className="text-xs text-slate-400">Laboratory Pass vs Fail batch outcomes</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qcResults}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#cbd5e1" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-800">
            <div>
              <p className="text-emerald-400 font-bold text-base">{stats?.passedQC || 0}</p>
              <p className="text-slate-400 text-[10px]">Passed Batches</p>
            </div>
            <div>
              <p className="text-rose-400 font-bold text-base">{stats?.failedQC || 0}</p>
              <p className="text-slate-400 text-[10px]">Failed Batches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Biometric Face Attendance Modal */}
      <FaceAttendanceModal
        isOpen={faceAttendanceOpen}
        type={attendanceType}
        onClose={() => setFaceAttendanceOpen(false)}
        onSuccess={() => {
          setFaceAttendanceOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
};

/* Reusable KPI Card */
const KpiCard = ({ title, value, icon, color = "indigo", subtitle }) => {
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
      <div className="flex justify-between items-center mb-1.5">
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

export default AdminDashboard;