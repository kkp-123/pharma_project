import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import FaceAttendanceModal from "../../components/FaceAttendanceModal";

import {
  Factory,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  ScanFace,
  TrendingUp,
  Package,
  Users,
  Building2,
  Layers,
  PlusCircle,
  Zap,
  Filter,
  X,
  Play,
  Check,
  Search,
  SlidersHorizontal,
  Flame,
  LogIn,
  LogOut,
  Download,
  FileText
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const STAGES = [
  "Formulation / Granulation",
  "Compression & Blending",
  "Coating & Polishing",
  "Blister / Bottle Packaging",
  "Sent to Quality Control (QC)"
];

const ProductionDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [summaryData, setSummaryData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [demands, setDemands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Tabs: "batches" | "demands" | "create_batch" | "team"
  const [activeTab, setActiveTab] = useState("batches");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const [newBatchModalOpen, setNewBatchModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);

  // Batch Form
  const [batchForm, setBatchForm] = useState({
    product: "",
    quantity: 25000,
    manufactureDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().split("T")[0],
    productionDemand: null
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      const [summaryRes, batchesRes, demandsRes, productsRes, attendanceStatusRes] = await Promise.all([
        api.get(`/dashboard/manager/summary?department=Production&month=${month}`),
        api.get("/batch/getBatch").catch(() => ({ data: [] })),
        api.get("/production-demand").catch(() => ({ data: [] })),
        api.get("/products/all").catch(() => ({ data: [] })),
        api.get("/attendance/today-status").catch(() => ({ data: { checkedIn: false, checkedOut: false } }))
      ]);

      setSummaryData(summaryRes.data);
      setBatches(batchesRes.data?.batches || (Array.isArray(batchesRes.data) ? batchesRes.data : []));
      setDemands(demandsRes.data?.demands || (Array.isArray(demandsRes.data) ? demandsRes.data : []));
      setProducts(productsRes.data?.products || (Array.isArray(productsRes.data) ? productsRes.data : []));
      setMyAttendanceStatus(attendanceStatusRes.data || { checkedIn: false, checkedOut: false });
    } catch (err) {
      console.error("Production dashboard fetch error:", err);
      toast.error("Failed to load Production dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Export Production Batches to CSV
  const exportProductionCSV = () => {
    if (batches.length === 0) return toast.error("No production batches to export");

    const headers = ["Batch Number", "Product Formulation", "Batch Size", "Current Stage", "Manufacturing Date", "Expiry Date", "QC Status"];
    const rows = batches.map((b) => [
      b.batchNumber || b._id,
      `"${b.product?.name || "N/A"}"`,
      b.quantity || 0,
      `"${b.stage || "Formulation"}"`,
      b.manufactureDate ? new Date(b.manufactureDate).toLocaleDateString() : "-",
      b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "-",
      b.qcStatus || "pending"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Production_Lifecycle_Report_${month}.csv`);
    link.click();
  };

  // Export Production Batches to PDF
  const exportProductionPDF = () => {
    if (batches.length === 0) return toast.error("No production batches to export");

    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("PHARMACEUTICAL PRODUCTION & BATCH SYNTHESIS REPORT", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const totalUnits = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    doc.text(`Period: ${month} | Total Batches: ${batches.length} | Manufactured Volume: ${totalUnits.toLocaleString()} Units`, 14, 23);

    autoTable(doc, {
      startY: 35,
      head: [["Batch #", "Formulation", "Volume", "Current Stage", "Mfg Date", "QC Status"]],
      body: batches.map((b) => [
        b.batchNumber || b._id.slice(-6),
        b.product?.name || "N/A",
        `${(b.quantity || 0).toLocaleString()} units`,
        b.stage || "Formulation",
        b.manufactureDate ? new Date(b.manufactureDate).toLocaleDateString() : "-",
        (b.qcStatus || "pending").toUpperCase()
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });

    doc.save(`Production_Report_${month}.pdf`);
  };

  useEffect(() => {
    fetchProductionData();
  }, [month]);

  // Leave Action
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leave/status/${leaveId}`, { status });
      toast.success(`Leave request ${status}`);
      fetchProductionData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update leave status");
    }
  };

  // Launch New Batch
  const handleLaunchBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.product || !batchForm.quantity) {
      return toast.error("Please select formulation and specify batch size");
    }

    try {
      setSubmittingBatch(true);
      await api.post("/batch/add", batchForm);
      toast.success("New industrial batch launched on the production line!");
      setNewBatchModalOpen(false);
      setSelectedDemand(null);
      setBatchForm({
        product: "",
        quantity: 25000,
        manufactureDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().split("T")[0],
        productionDemand: null
      });
      fetchProductionData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to launch batch");
    } finally {
      setSubmittingBatch(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Production Manufacturing Operations...</p>
        </div>
      </div>
    );
  }

  const pendingLeaves = summaryData?.pendingLeaves || [];
  const todayAttendance = summaryData?.todayAttendance || [];
  const deptSpecific = summaryData?.departmentSpecific || {};

  const activeBatches = batches.filter((b) => b.status === "pending");
  const approvedBatches = batches.filter((b) => b.status === "approved");

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      !search ||
      b.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.product?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const chartData = demands.slice(0, 8).map((d) => ({
    name: d.product?.name || "Product",
    required: d.quantity || d.requiredQuantity || 0
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 size={14} /> Pharmaceutical Manufacturing & Processing Plant
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Production & Manufacturing Floor 🏭
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Active Batch Lines, Demand Schedules, Formulation Synthesis, and Floor Operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white outline-none"
          />
          <button
            onClick={() => setNewBatchModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <PlusCircle size={16} /> Launch New Batch
          </button>

          {!myAttendanceStatus?.checkedIn ? (
            <button
              onClick={() => {
                setAttendanceType("checkin");
                setFaceAttendanceOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
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

      {/* 2. Top Production KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Active On Line" value={activeBatches.length} icon={<Factory size={18} />} color="amber" subtitle="Currently in Synthesis" />
        <KpiCard title="Released Batches" value={approvedBatches.length} icon={<CheckCircle2 size={18} />} color="emerald" subtitle="Passed QA Release" />
        <KpiCard title="Market Demands" value={demands.length} icon={<Zap size={18} />} color="rose" subtitle="Market Schedules" />
        <KpiCard title="Floor Staff" value={summaryData?.presentToday || 0} icon={<Users size={18} />} color="indigo" subtitle={`Team: ${summaryData?.teamSize || 0}`} />
        <KpiCard title="Total Overtime" value={`${summaryData?.totalOvertimeHours || 0} hrs`} icon={<TrendingUp size={18} />} color="teal" subtitle="Overtime Hours" />
        <KpiCard title="Pending Leaves" value={pendingLeaves.length} icon={<Briefcase size={18} />} color="purple" subtitle="Approval Queue" />
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "batches" ? "bg-amber-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Factory size={14} /> Production Line Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab("demands")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "demands" ? "bg-orange-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Zap size={14} /> Market Demands & Auto-Batch Converter ({demands.length})
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "team" ? "bg-indigo-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Users size={14} /> Floor Operations & Attendance ({todayAttendance.length})
        </button>
      </div>

      {/* 4. TAB 1: PRODUCTION LINE BATCHES */}
      {activeTab === "batches" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search batch or drug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-slate-300 outline-none"
              >
                <option value="ALL">All Batch Statuses</option>
                <option value="pending">In Production / Pending QC</option>
                <option value="approved">Approved & Released</option>
                <option value="rejected">Rejected / Non-conformance</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportProductionCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={exportProductionPDF}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileText size={13} /> Export PDF
              </button>
              <button
                onClick={() => setNewBatchModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <PlusCircle size={14} /> Formulate New Batch
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Product Formulation</th>
                  <th className="p-3">Batch Quantity</th>
                  <th className="p-3">Manufacturing Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Line Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => (
                    <tr key={batch._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-amber-300">{batch.batchNumber}</td>
                      <td className="p-3 font-semibold text-slate-200">{batch.product?.name || "Product"}</td>
                      <td className="p-3 font-mono text-indigo-300 font-bold">{batch.quantity?.toLocaleString()} units</td>
                      <td className="p-3 text-slate-400">{new Date(batch.manufactureDate || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-400">{new Date(batch.expiryDate || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          batch.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : batch.status === "rejected"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          {batch.status === "approved" ? "✅ Released to Stock" : batch.status === "rejected" ? "❌ Rejected (QC Failed)" : "⚡ In Synthesis / Pending QC"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No manufacturing line batches found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 2: MARKET DEMANDS & SCHEDULING */}
      {activeTab === "demands" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Zap size={18} className="text-orange-400" />
                Market & Hospital Production Demands
              </h3>
              <p className="text-xs text-slate-400">Incoming demand orders requiring manufacturing scheduling</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Product Formulation</th>
                  <th className="p-3">Required Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Schedule Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {demands.length > 0 ? (
                  demands.map((demand) => (
                    <tr key={demand._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-slate-200">{demand.product?.name || "Product"}</td>
                      <td className="p-3 font-mono font-bold text-amber-300">{(demand.quantity || demand.requiredQuantity || 0).toLocaleString()} units</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          demand.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : demand.status === "in-production"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-orange-500/20 text-orange-400"
                        }`}>
                          {demand.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(demand.startDate || demand.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {demand.status !== "completed" && (
                          <button
                            onClick={() => {
                              setSelectedDemand(demand);
                              setBatchForm({
                                product: demand.product?._id || demand.product,
                                quantity: demand.quantity || demand.requiredQuantity || 25000,
                                manufactureDate: new Date().toISOString().split("T")[0],
                                expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().split("T")[0],
                                productionDemand: demand._id
                              });
                              setNewBatchModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-[11px] font-bold shadow transition flex items-center gap-1 ml-auto"
                          >
                            <Play size={12} /> Convert to Line Batch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No market demands currently logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 3: FLOOR STAFF OPERATIONS */}
      {activeTab === "team" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leave Approvals */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-400" />
                Floor Technician Leave Approvals
              </h3>
              <span className="text-xs text-slate-400">{pendingLeaves.length} pending</span>
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
                        <span className="capitalize font-semibold text-amber-400">{leave.type} Leave</span> (
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
                  No pending leave requests from floor staff.
                </div>
              )}
            </div>
          </div>

          {/* Floor Attendance Today */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 size={18} className="text-indigo-400" />
                Floor Team Attendance Today
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
                        No floor staff attendance logged today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH NEW PHARMACEUTICAL BATCH */}
      {newBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Flame size={18} className="text-amber-400" />
                Launch Industrial Line Batch
              </h3>
              <button onClick={() => setNewBatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Schedule active pharmaceutical formulation synthesis on manufacturing line.
            </p>

            <form onSubmit={handleLaunchBatch} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Product Formulation</label>
                <select
                  value={batchForm.product}
                  onChange={(e) => setBatchForm({ ...batchForm, product: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  required
                >
                  <option value="">Select Drug Formulation</option>
                  {products.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} ({prod.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Target Batch Size (Units)</label>
                <input
                  type="number"
                  value={batchForm.quantity}
                  onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Mfg Date</label>
                  <input
                    type="date"
                    value={batchForm.manufactureDate}
                    onChange={(e) => setBatchForm({ ...batchForm, manufactureDate: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBatchModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingBatch ? "Launching..." : "Launch Batch"}
                </button>
              </div>
            </form>
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
          fetchProductionData();
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
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-slate-400 text-[11px] font-medium truncate">{title}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <h4 className="text-lg sm:text-xl font-extrabold text-white">{value}</h4>
      {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
};

export default ProductionDashboard;