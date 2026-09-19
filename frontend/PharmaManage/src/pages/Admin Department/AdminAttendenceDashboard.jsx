import { useEffect, useState } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CalendarCheck,
  Search,
  Filter,
  Download,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  ScanFace,
  FileSpreadsheet,
  FileText,
  Building2,
  X
} from "lucide-react";

const AdminAttendanceDashboard = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [verificationMethod, setVerificationMethod] = useState("ALL");
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    status: "present",
    checkIn: "",
    checkOut: "",
    reason: "",
    notes: ""
  });
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = `?month=${month}&department=${department}&status=${status}&verificationMethod=${verificationMethod}&search=${search}`;
      
      const [summaryRes, reportRes] = await Promise.all([
        api.get(`/attendance/dashboard${query}`),
        api.get(`/attendance/report${query}`)
      ]);

      setStats(summaryRes.data || {});
      setRecords(reportRes.data?.data || (Array.isArray(reportRes.data) ? reportRes.data : (summaryRes.data?.data || [])));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, department, status, verificationMethod]);

  // Handle Search on Enter or Click
  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!records.length) return toast.error("No records to export");

    const headers = ["Employee Name", "Email", "Department", "Date", "Check-In", "Check-Out", "Working Hours", "Method", "Late Mins", "Status", "Notes"];
    const rows = records.map((r) => [
      `"${r.employee?.name || "Unknown"}"`,
      `"${r.employee?.email || ""}"`,
      `"${r.employee?.department || ""}"`,
      `"${r.date}"`,
      `"${r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : ""}"`,
      `"${r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : ""}"`,
      r.totalHours || r.workingHours || 0,
      `"${r.verificationMethod || "location"}"`,
      r.lateMinutes || 0,
      `"${r.status}"`,
      `"${r.notes || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${month}_${department}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // Export to PDF Report
  const exportToPDF = () => {
    if (!records.length) return toast.error("No records to export");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("PharmaSys - Employee Attendance Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${month} | Department: ${department}`, 14, 22);

    const tableColumn = ["Employee", "Dept", "Date", "Check-In", "Check-Out", "Hours", "Method", "Status"];
    const tableRows = records.map((r) => [
      r.employee?.name || "Unknown",
      r.employee?.department || "-",
      r.date,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
      `${r.totalHours || r.workingHours || 0}h`,
      r.verificationMethod === "face" ? "Face AI" : "Location",
      r.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 }
    });

    doc.save(`Attendance_Report_${month}_${department}.pdf`);
    toast.success("PDF Report downloaded successfully");
  };

  // Open Override Modal
  const openOverrideModal = (record) => {
    setSelectedRecord(record);
    setOverrideForm({
      status: record.status || "present",
      checkIn: record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : "",
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : "",
      reason: "",
      notes: record.notes || ""
    });
    setOverrideModalOpen(true);
  };

  // Submit Manual Override
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideForm.reason.trim()) {
      return toast.error("Please provide a valid reason for manual attendance correction.");
    }

    try {
      setSubmittingOverride(true);
      await api.put(`/attendance/${selectedRecord._id}/override`, overrideForm);
      toast.success("Attendance modified & logged to Audit Trail");
      setOverrideModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to override attendance");
    } finally {
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-6">
      {/* 1. Header & Quick Export Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarCheck size={14} /> Biometric & Location Log Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Attendance Reports & Management
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Filter, inspect biometric validation logs, execute manual overrides, and generate payroll exports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-2"
          >
            <FileText size={15} />
            Export PDF Report
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Present Records" value={stats.present || 0} color="emerald" subtitle="Active presence" />
        <KpiCard title="Absent Records" value={stats.absent || 0} color="rose" subtitle="Missing or < 4h" />
        <KpiCard title="Half Day Records" value={stats.halfDay || 0} color="amber" subtitle="4h to 7h logged" />
        <KpiCard title="Total Overtime Hours" value={`${stats.totalOvertime || 0} hrs`} color="indigo" subtitle={`Late Check-Ins: ${stats.lateCount || 0}`} />
      </div>

      {/* 3. Comprehensive Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search employee name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
          />
        </form>

        {/* Month */}
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        />

        {/* Department */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Departments</option>
          <option value="HR">HR</option>
          <option value="QC">QC</option>
          <option value="Production">Production</option>
          <option value="Inventory">Inventory</option>
          <option value="Sales">Sales</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="half-day">Half Day</option>
        </select>

        {/* Verification Method */}
        <select
          value={verificationMethod}
          onChange={(e) => setVerificationMethod(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Verification Methods</option>
          <option value="face">👤 Face Recognition</option>
          <option value="location">📍 GPS Location</option>
          <option value="admin">✏️ Admin Manual</option>
        </select>
      </div>

      {/* 4. Attendance Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Displaying {records.length} attendance entries</span>
          <span>Click 'Edit' to perform an authorized manual override</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Check-In</th>
                <th className="p-3.5">Check-Out</th>
                <th className="p-3.5">Hours</th>
                <th className="p-3.5">Overtime</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-semibold text-slate-200">
                      <div>{r.employee?.name || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{r.employee?.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">{r.employee?.department || "-"}</td>
                    <td className="p-3.5 text-slate-200 font-mono">{r.date}</td>
                    <td className="p-3.5 text-emerald-400 font-mono">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      {r.lateMinutes > 0 && <span className="ml-1 text-[10px] text-amber-400 font-sans">({r.lateMinutes}m late)</span>}
                    </td>
                    <td className="p-3.5 text-rose-400 font-mono">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </td>
                    <td className="p-3.5 font-semibold text-indigo-300">{r.totalHours || r.workingHours || 0} hrs</td>
                    <td className="p-3.5 text-amber-400">{r.isOvertime ? `${r.overtimeHours || 0} hrs` : "-"}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        r.verificationMethod === "face"
                          ? "bg-purple-900/30 text-purple-300 border border-purple-800"
                          : r.verificationMethod === "admin"
                          ? "bg-blue-900/30 text-blue-300 border border-blue-800"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {r.verificationMethod === "face" ? "👤 Face" : r.verificationMethod === "admin" ? "✏️ Override" : "📍 GPS"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.status === "present"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : r.status === "half-day"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openOverrideModal(r)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 ml-auto"
                      >
                        <Edit size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-500 text-xs">
                    No attendance logs match the chosen filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {overrideModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">Manual Attendance Override</h3>
                <p className="text-xs text-slate-400">
                  {selectedRecord.employee?.name} • {selectedRecord.date}
                </p>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Attendance Status</label>
                <select
                  value={overrideForm.status}
                  onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Check-In DateTime</label>
                <input
                  type="datetime-local"
                  value={overrideForm.checkIn}
                  onChange={(e) => setOverrideForm({ ...overrideForm, checkIn: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Check-Out DateTime</label>
                <input
                  type="datetime-local"
                  value={overrideForm.checkOut}
                  onChange={(e) => setOverrideForm({ ...overrideForm, checkOut: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Correction Reason <span className="text-rose-400">*</span> (Required for Audit Log)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biometric reader missed badge, employee worked onsite"
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Additional Notes</label>
                <textarea
                  value={overrideForm.notes}
                  onChange={(e) => setOverrideForm({ ...overrideForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none h-16"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingOverride ? "Saving..." : "Save Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Reusable Card */
const KpiCard = ({ title, value, color = "indigo", subtitle }) => {
  const colorMap = {
    indigo: "border-indigo-500/20 bg-indigo-950/20 text-indigo-400",
    emerald: "border-emerald-500/20 bg-emerald-950/20 text-emerald-400",
    rose: "border-rose-500/20 bg-rose-950/20 text-rose-400",
    amber: "border-amber-500/20 bg-amber-950/20 text-amber-400"
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`p-4 rounded-2xl bg-slate-900/80 border shadow-lg flex flex-col justify-between ${colorMap[color] || colorMap.indigo}`}
    >
      <span className="text-slate-400 text-xs font-medium">{title}</span>
      <div className="mt-1">
        <h4 className="text-xl font-extrabold text-white">{value}</h4>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default AdminAttendanceDashboard;