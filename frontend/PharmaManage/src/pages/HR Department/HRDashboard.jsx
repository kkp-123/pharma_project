import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import FaceAttendanceModal from "../../components/FaceAttendanceModal";
import FaceRegistrationModal from "../../components/FaceRegistrationModal";

import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  ScanFace,
  Building2,
  Trash2,
  Search,
  DollarSign,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  LogIn,
  LogOut,
  Edit
} from "lucide-react";

const HRDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");

  // Modals
  const [faceAttendanceOpen, setFaceAttendanceOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState("checkin");
  const [myAttendanceStatus, setMyAttendanceStatus] = useState({
    checkedIn: false,
    checkedOut: false,
    checkInTime: null,
    checkOutTime: null,
    workingHours: 0
  });

  const [faceRegistrationOpen, setFaceRegistrationOpen] = useState(false);
  const [selectedEmployeeForFace, setSelectedEmployeeForFace] = useState(null);

  // Tabs: "overview" | "manual_attendance" | "face_management"
  const [activeTab, setActiveTab] = useState("overview");

  // Manual Attendance Form
  const [manualForm, setManualForm] = useState({
    employeeId: "",
    date: new Date().toISOString().slice(0, 10),
    checkInTime: "09:30",
    checkOutTime: "17:30",
    status: "present",
    reason: "HR Manual Duty Verification",
    notes: ""
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const [summaryRes, attendanceStatusRes] = await Promise.all([
        api.get(`/dashboard/manager/summary?department=HR&month=${month}`),
        api.get("/attendance/today-status").catch(() => ({ data: { checkedIn: false, checkedOut: false } }))
      ]);
      setSummaryData(summaryRes.data);
      setMyAttendanceStatus(attendanceStatusRes.data || { checkedIn: false, checkedOut: false });
    } catch (err) {
      console.error("HR dashboard fetch error:", err);
      toast.error("Failed to load HR dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [month]);

  // Leave Approval / Rejection
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leave/status/${leaveId}`, { status });
      toast.success(`Leave request marked as ${status}`);
      fetchHRData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update leave status");
    }
  };

  // Remove Face Data
  const handleRemoveFace = async (employee) => {
    if (!window.confirm(`Are you sure you want to remove face biometric template for ${employee.name}?`)) return;

    try {
      await api.delete(`/users/${employee._id}/face`);
      toast.success(`Face registration removed for ${employee.name}`);
      fetchHRData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove face registration");
    }
  };

  // Submit Manual Attendance
  const handleManualAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.date) {
      return toast.error("Please select an employee and date");
    }
    if (!manualForm.reason || !manualForm.reason.trim()) {
      return toast.error("A mandatory justification reason is required");
    }

    try {
      setSubmittingManual(true);
      const res = await api.post("/attendance/manual", manualForm);
      toast.success(res.data?.message || "Manual attendance recorded!");
      fetchHRData();
      setManualForm({
        ...manualForm,
        notes: ""
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record manual attendance");
    } finally {
      setSubmittingManual(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading HR Management Portal...</p>
        </div>
      </div>
    );
  }

  const teamMembers = summaryData?.teamMembers || [];
  const pendingLeaves = summaryData?.pendingLeaves || [];
  const todayAttendance = summaryData?.todayAttendance || [];
  const deptSpecific = summaryData?.departmentSpecific || {};
  console.log("team members",teamMembers);

  const filteredMembers = teamMembers.filter((emp) => {
    if (!search) return true;
    return (
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 size={14} /> Human Resources Management Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            HR Dashboard 👩‍💼
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Personnel Directory, Biometric Face Registrations, Leave Approvals, and Attendance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white outline-none"
          />
          {!myAttendanceStatus?.checkedIn ? (
            <button
              onClick={() => {
                setAttendanceType("checkin");
                setFaceAttendanceOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
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
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition animate-pulse"
            >
              <LogOut size={15} /> Check-Out (Face)
            </button>
          ) : (
            <div className="px-3.5 py-2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold rounded-xl text-xs flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" />
              Checked Out ({myAttendanceStatus.workingHours}h)
            </div>
          )}
        </div>
      </div>

      {/* 2. Top HR KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard title="HR Employees" value={summaryData?.teamSize || 0} icon={<Users size={18} />} color="indigo" />
        <KpiCard title="Present Today" value={summaryData?.presentToday || 0} icon={<CheckCircle2 size={18} />} color="emerald" />
        <KpiCard title="Absent Today" value={summaryData?.absentToday || 0} icon={<AlertCircle size={18} />} color="rose" />
        <KpiCard title="Late Arrivals" value={summaryData?.lateToday || 0} icon={<Clock size={18} />} color="purple" />
        <KpiCard title="Pending Leaves" value={pendingLeaves.length} icon={<Briefcase size={18} />} color="amber" />
        <KpiCard title="Face Registered" value={deptSpecific.faceRegisteredTotal || teamMembers.filter(m => m.faceData?.registered).length} icon={<ScanFace size={18} />} color="teal" />
        <KpiCard title="Total Company Staff" value={deptSpecific.totalEmployees || summaryData?.teamSize || 0} icon={<UserCheck size={18} />} color="blue" />
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "overview" ? "bg-indigo-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          📊 Overview & Attendance
        </button>
        <button
          onClick={() => setActiveTab("manual_attendance")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "manual_attendance" ? "bg-emerald-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Edit size={14} /> ✍️ Manual Attendance Entry
        </button>
        <button
          onClick={() => setActiveTab("face_management")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "face_management" ? "bg-purple-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <ScanFace size={14} /> Employee Face Biometric Management
        </button>
      </div>

      {/* TAB: Manual Attendance Entry */}
      {activeTab === "manual_attendance" && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit size={20} className="text-emerald-400" />
              Manual Attendance Recording & Shift Override
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Record manual check-ins, check-outs, or adjust duty status for employees with mandatory audit justification.
            </p>
          </div>

          <form onSubmit={handleManualAttendanceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Employee *</label>
                <select
                  required
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="" className="invert-bg">-- Select Staff Member --</option>
                  {teamMembers.map((emp) => (
                    <option key={emp._id} value={emp._id} className="invert-bg">
                      {emp.name} ({emp.department} - {emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duty Date *</label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Check-In Time</label>
                <input
                  type="time"
                  value={manualForm.checkInTime}
                  onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Check-Out Time</label>
                <input
                  type="time"
                  value={manualForm.checkOutTime}
                  onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Attendance Status *</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="present" className="invert-bg">Present (Full Shift)</option>
                  <option value="half-day" className="invert-bg">Half-Day (4 Hours)</option>
                  <option value="absent" className="invert-bg">Absent</option>
                  <option value="leave" className="invert-bg">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Audit Reason / Justification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Approved On-Duty Field Visit"
                  value={manualForm.reason}
                  onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Optional Notes</label>
              <textarea
                rows="2"
                placeholder="Additional audit or operational context..."
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingManual}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <Edit size={15} />
              {submittingManual ? "Saving Record..." : "Save Manual Attendance Record"}
            </button>
          </form>
        </div>
      )}

      {/* 4. TAB 1: Face Registration Management */}
      {activeTab === "face_management" ? (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ScanFace size={18} className="text-indigo-400" />
                Employee Face Template Management
              </h3>
              <p className="text-xs text-slate-400">
                Register or update 128-dimensional facial biometric embedding templates for attendance
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Biometric Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-slate-200">{emp.name}</td>
                      <td className="p-3 text-slate-400">{emp.email}</td>
                      <td className="p-3 text-slate-300">{emp.department || "HR"}</td>
                      <td className="p-3">
                        {emp.faceData?.registered ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✅ Face Registered
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ❌ Not Registered
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEmployeeForFace(emp);
                            setFaceRegistrationOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition"
                        >
                          {emp.faceData?.registered ? "Update Face" : "Register Face"}
                        </button>
                        {emp.faceData?.registered && (
                          <button
                            onClick={() => handleRemoveFace(emp)}
                            className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-[11px] font-semibold transition border border-rose-500/30"
                            title="Remove Face Biometrics"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No employees found matching the search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 5. TAB 2: HR Overview & Leave Approvals */
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Leave Requests */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-400" />
                Team Leave Approval Queue
              </h3>
              <span className="text-xs text-slate-400">{pendingLeaves.length} requests pending</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {pendingLeaves.length > 0 ? (
                pendingLeaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{leave.employee?.name}</h4>
                      <p className="text-slate-400 mt-0.5">
                        <span className="capitalize font-semibold text-indigo-400">{leave.type} Leave</span> (
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()})
                      </p>
                      <p className="text-slate-400 text-[11px] mt-1 italic">"{leave.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLeaveAction(leave._id, "approved")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave._id, "rejected")}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-semibold rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No pending leave approval requests.
                </div>
              )}
            </div>
          </div>

          {/* Today Attendance */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                Team Attendance Today
              </h3>
              <span className="text-xs text-slate-400">{todayAttendance.length} logs</span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {todayAttendance.length > 0 ? (
                    todayAttendance.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-200">{item.employee?.name}</td>
                        <td className="p-3 text-slate-300">
                          {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                        </td>
                        <td className="p-3 text-slate-300">
                          {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
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
                      <td colSpan="4" className="p-6 text-center text-slate-500">
                        No team attendance logged for today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Face Attendance Modal */}
      <FaceAttendanceModal
        isOpen={faceAttendanceOpen}
        type={attendanceType}
        onClose={() => setFaceAttendanceOpen(false)}
        onSuccess={() => {
          setFaceAttendanceOpen(false);
          fetchHRData();
        }}
      />

      {/* Face Registration Modal */}
      {selectedEmployeeForFace && (
        <FaceRegistrationModal
          isOpen={faceRegistrationOpen}
          employee={selectedEmployeeForFace}
          onClose={() => {
            setFaceRegistrationOpen(false);
            setSelectedEmployeeForFace(null);
          }}
          onSuccess={() => {
            setFaceRegistrationOpen(false);
            setSelectedEmployeeForFace(null);
            fetchHRData();
          }}
        />
      )}
    </div>
  );
};

/* Reusable KPI Card */
const KpiCard = ({ title, value, color = "indigo", icon }) => {
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
      <h4 className="text-lg sm:text-xl font-extrabold text-white">{value}</h4>
    </motion.div>
  );
};

export default HRDashboard;