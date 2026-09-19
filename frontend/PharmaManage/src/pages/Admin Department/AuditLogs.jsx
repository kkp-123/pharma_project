import React, { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const query = `?page=${page}&limit=20&action=${actionFilter}&entity=${entityFilter}&search=${search}&startDate=${startDate}&endDate=${endDate}`;
      const res = await api.get(`/admin/audit-logs${query}`);

      setLogs(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionBadgeColor = (action) => {
    if (action.includes("CREATE") || action.includes("REGISTERED")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (action.includes("DELETE") || action.includes("REMOVED") || action.includes("REJECTED")) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (action.includes("OVERRIDE") || action.includes("UPDATE")) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (action.includes("LOGIN")) return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert size={14} /> Enterprise Security & Compliance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            System Audit Trail & Access Logs
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Immutable tracking of user authentication, biometric registrations, attendance overrides, and entity changes.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by action, user, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
          />
        </form>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Actions</option>
          <option value="LOGIN">User Logins</option>
          <option value="USER_CREATED">User Created</option>
          <option value="USER_UPDATED">User Updated</option>
          <option value="USER_DELETED">User Deleted</option>
          <option value="FACE_REGISTERED">Face Registered</option>
          <option value="FACE_UPDATED">Face Updated</option>
          <option value="FACE_REMOVED">Face Removed</option>
          <option value="ATTENDANCE_CHECKIN">Attendance Check-In</option>
          <option value="ATTENDANCE_CHECKOUT">Attendance Check-Out</option>
          <option value="ATTENDANCE_OVERRIDE">Attendance Override</option>
          <option value="LEAVE_APPROVED">Leave Approved</option>
        </select>

        {/* Entity Filter */}
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Entities</option>
          <option value="User">User</option>
          <option value="Attendance">Attendance</option>
          <option value="Leave">Leave</option>
          <option value="QC">QC</option>
          <option value="Inventory">Inventory</option>
          <option value="Salary">Salary</option>
        </select>

        {/* Date Filters */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
          placeholder="Start Date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
          placeholder="End Date"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-slate-200 font-sans font-semibold">
                      {log.userName || log.user?.name || "System"}
                    </td>
                    <td className="p-3.5 capitalize text-slate-400 font-sans">
                      {log.userRole || log.user?.role || "system"}
                    </td>
                    <td className="p-3.5 font-sans">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-sans">{log.entity}</td>
                    <td className="p-3.5 text-slate-500 text-[11px]">{log.ipAddress || "-"}</td>
                    <td className="p-3.5 font-sans text-slate-300 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-sans text-xs">
                    No audit records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events logged)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

