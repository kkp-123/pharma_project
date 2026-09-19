import React, { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Users,
  Clock,
  Calendar,
  Building2,
  Search,
  Download,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const DepartmentAttendancePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}") || {
    name: "Manager",
    department: "Production"
  };

  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/dashboard?month=${month}`);
      const records = res.data?.data || (Array.isArray(res.data) ? res.data : []);

      const deptFiltered = records.filter(
        (r) => !user.department || r.employee?.department === user.department || user.role === "admin"
      );

      setAttendance(deptFiltered);

      const empMap = new Map();
      deptFiltered.forEach((r) => {
        if (r.employee?._id) {
          empMap.set(r.employee._id, r.employee);
        }
      });
      setEmployees(Array.from(empMap.values()));
    } catch (error) {
      toast.error("Failed to load attendance");
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  const displayRecords = attendance.filter((r) => {
    if (selectedEmployee !== "ALL" && r.employee?._id !== selectedEmployee) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search) {
      const query = search.toLowerCase();
      return (
        r.employee?.name?.toLowerCase().includes(query) ||
        r.employee?.email?.toLowerCase().includes(query) ||
        r.date?.includes(query)
      );
    }
    return true;
  });

  const totalPresent = displayRecords.filter((r) => r.status === "present").length;
  const totalAbsent = displayRecords.filter((r) => r.status === "absent").length;
  const totalHalfDay = displayRecords.filter((r) => r.status === "half-day").length;
  const totalOvertime = displayRecords.reduce((s, r) => s + (r.overtimeHours || 0), 0);

  const exportCSV = () => {
    if (displayRecords.length === 0) return toast.error("No attendance data to export");

    const headers = ["Date", "Employee Name", "Email", "Department", "Status", "Check-In", "Check-Out", "Hours", "Overtime", "Verification", "Notes"];
    const rows = displayRecords.map((r) => [
      r.date,
      `"${r.employee?.name || "N/A"}"`,
      r.employee?.email || "",
      r.employee?.department || "",
      r.status,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "-",
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "-",
      r.workingHours || r.totalHours || 0,
      r.overtimeHours || 0,
      r.verificationMethod || "face",
      `"${r.notes || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${user.department || "Dept"}_${month}.csv`;
    link.click();
  };

  const exportPDF = () => {
    if (displayRecords.length === 0) return toast.error("No attendance data to export");

    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(`DEPARTMENT ATTENDANCE LEDGER - ${(user.department || "ALL").toUpperCase()}`, 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Month: ${month} | Total Records: ${displayRecords.length} | Present: ${totalPresent} | Absent: ${totalAbsent}`, 14, 23);

    autoTable(doc, {
      startY: 35,
      head: [["Date", "Employee", "Department", "Status", "Check In", "Check Out", "Hours", "Method"]],
      body: displayRecords.map((r) => [
        r.date,
        r.employee?.name || "N/A",
        r.employee?.department || "",
        r.status?.toUpperCase(),
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString().slice(0, 5) : "-",
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString().slice(0, 5) : "-",
        `${r.workingHours || 0} hrs`,
        r.verificationMethod || "face"
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });

    doc.save(`Attendance_${user.department || "Dept"}_${month}.pdf`);
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="text-emerald-400" size={28} />
            {user.department || "Department"} Attendance Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monthly & Yearly duty records, biometric verification logs, and exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 rounded-xl border border-slate-700 px-3 py-1.5 flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
          </div>

          <button
            onClick={exportCSV}
            className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Download size={14} />
            CSV
          </button>

          <button
            onClick={exportPDF}
            className="bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-lg transition"
          >
            <FileText size={14} />
            PDF Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">Total Duty Records</p>
            <h3 className="text-2xl font-bold mt-1">{displayRecords.length}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-emerald-400">Present Shifts</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{totalPresent}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-rose-400">Absent / Unrecorded</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{totalAbsent}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-400">Total Overtime</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{totalOvertime} hrs</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock size={24} />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] flex items-center bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search by employee name, email, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white w-full focus:outline-none"
          />
        </div>

        <div className="flex items-center bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 gap-2">
          <Users size={14} className="text-slate-400" />
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none"
          >
            <option value="ALL" className="invert-bg">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id} className="invert-bg">
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none"
          >
            <option value="ALL" className="invert-bg">All Statuses</option>
            <option value="present" className="invert-bg">Present</option>
            <option value="absent" className="invert-bg">Absent</option>
            <option value="half-day" className="invert-bg">Half Day</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/95 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Status</th>
                <th className="p-4">Check In</th>
                <th className="p-4">Check Out</th>
                <th className="p-4">Working Hours</th>
                <th className="p-4">Method</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700">
              {displayRecords.map((r) => (
                <tr key={r._id} className="hover:bg-slate-700/40 transition">
                  <td className="p-4 font-medium">{r.date}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-white">{r.employee?.name || "N/A"}</p>
                      <p className="text-xs text-slate-400">{r.employee?.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${r.status === "present" ? "bg-emerald-500/20 text-emerald-400" : r.status === "absent" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {r.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "-"}
                  </td>
                  <td className="p-4">
                    {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "-"}
                  </td>
                  <td className="p-4 font-semibold text-emerald-400">
                    {r.workingHours || r.totalHours || 0} hrs
                  </td>
                  <td className="p-4 capitalize text-xs">
                    {r.verificationMethod || "face"}
                  </td>
                  <td className="p-4 text-xs text-slate-400 max-w-[180px] truncate">
                    {r.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayRecords.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <FileText size={40} className="mx-auto mb-2 opacity-30" />
              <p>No attendance records found for this selection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentAttendancePage;
