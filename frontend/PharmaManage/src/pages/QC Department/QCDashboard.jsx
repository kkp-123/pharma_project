import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import FaceAttendanceModal from "../../components/FaceAttendanceModal";

import {
  Beaker,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  ScanFace,
  TrendingUp,
  FileText,
  Users,
  Building2,
  X,
  Search,
  ShieldCheck,
  ShieldAlert,
  TestTube,
  Microscope,
  Check,
  FileCheck,
  LogIn,
  LogOut,
  Download
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const QCDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [summaryData, setSummaryData] = useState(null);
  const [qcHistory, setQcHistory] = useState([]);
  const [pendingBatchesList, setPendingBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Tabs: "pending" | "history" | "analytics" | "team"
  const [activeTab, setActiveTab] = useState("pending");
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

  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [selectedBatchForQC, setSelectedBatchForQC] = useState(null);

  // QC Assay Form
  const [qcForm, setQcForm] = useState({
    result: "pass",
    assayPurity: "99.4",
    dissolutionRate: "92",
    disintegrationTime: "4.5",
    microbialStatus: "Pass (<10 CFU/g)",
    remarks: "Meets all IP/BP/USP pharmacopoeial quality release standards."
  });
  const [submittingQC, setSubmittingQC] = useState(false);

  const fetchQCData = async () => {
    try {
      setLoading(true);
      const [summaryRes, qcRes, batchesRes, attendanceStatusRes] = await Promise.all([
        api.get(`/dashboard/manager/summary?department=QC&month=${month}`),
        api.get("/qc").catch(() => ({ data: { data: [] } })),
        api.get("/batch/getBatch").catch(() => ({ data: [] })),
        api.get("/attendance/today-status").catch(() => ({ data: { checkedIn: false, checkedOut: false } }))
      ]);

      setSummaryData(summaryRes.data);
      setQcHistory(qcRes.data?.data || (Array.isArray(qcRes.data) ? qcRes.data : []));
      setMyAttendanceStatus(attendanceStatusRes.data || { checkedIn: false, checkedOut: false });

      const rawBatches = Array.isArray(batchesRes.data)
        ? batchesRes.data
        : (batchesRes.data?.batches || batchesRes.data?.data || []);
      const pendingList = rawBatches.filter((b) => b.status === "pending");
      setPendingBatchesList(pendingList);
    } catch (err) {
      console.error("QC dashboard fetch error:", err);
      toast.error("Failed to load QC dashboard data");
      setQcHistory([]);
      setPendingBatchesList([]);
    } finally {
      setLoading(false);
    }
  };

  // Export QC History to CSV
  const exportQCCSV = () => {
    if (qcHistory.length === 0) return toast.error("No QC inspection records to export");

    const headers = ["Batch Number", "Product Formulation", "Volume", "QC Result", "Inspector", "Inspection Date", "Assay Remarks"];
    const rows = qcHistory.map((item) => {
      const b = item.batch || item;
      return [
        b.batchNumber || b._id,
        `"${b.product?.name || "N/A"}"`,
        b.quantity || 0,
        item.status || b.qcStatus || "pass",
        `"${item.inspectedBy?.name || "QC Analyst"}"`,
        item.checkedAt ? new Date(item.checkedAt).toLocaleDateString() : "-",
        `"${item.remarks || ""}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QC_Assay_Certifications_${month}.csv`);
    link.click();
  };

  // Export QC History to PDF
  const exportQCPDF = () => {
    if (qcHistory.length === 0) return toast.error("No QC inspection records to export");

    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("QUALITY CONTROL & PHARMACEUTICAL ASSAY REPORT", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const passCount = qcHistory.filter((i) => (i.status || i.batch?.qcStatus) === "approved" || (i.status || i.batch?.qcStatus) === "pass").length;
    doc.text(`Period: ${month} | Inspected Batches: ${qcHistory.length} | Conforming (Passed): ${passCount} | Quarantined (Rejected): ${qcHistory.length - passCount}`, 14, 23);

    autoTable(doc, {
      startY: 35,
      head: [["Batch #", "Formulation", "Batch Size", "QC Result", "Inspector", "Date"]],
      body: qcHistory.map((item) => {
        const b = item.batch || item;
        const res = (item.status || b.qcStatus || "pass").toUpperCase();
        return [
          b.batchNumber || b._id.slice(-6),
          b.product?.name || "N/A",
          `${(b.quantity || 0).toLocaleString()} units`,
          res,
          item.inspectedBy?.name || "QC Analyst",
          item.checkedAt ? new Date(item.checkedAt).toLocaleDateString() : "-"
        ];
      }),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });

    doc.save(`QC_Assay_Report_${month}.pdf`);
  };

  useEffect(() => {
    fetchQCData();
  }, [month]);

  // Leave Action
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leave/status/${leaveId}`, { status });
      toast.success(`Leave request ${status}`);
      fetchQCData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update leave status");
    }
  };

  // Submit QC Laboratory Inspection
  const handleInspectQC = async (e) => {
    e.preventDefault();
    if (!selectedBatchForQC) return;

    try {
      setSubmittingQC(true);
      const compiledRemarks = `[Chemical Assay: ${qcForm.assayPurity}%] [Dissolution: ${qcForm.dissolutionRate}%] [Disintegration: ${qcForm.disintegrationTime}m] [Microbial: ${qcForm.microbialStatus}] - ${qcForm.remarks}`;

      await api.post("/qc/check", {
        batchId: selectedBatchForQC._id,
        result: qcForm.result,
        remarks: compiledRemarks
      });

      toast.success(
        qcForm.result === "pass"
          ? `Batch ${selectedBatchForQC.batchNumber} PASSED & RELEASED TO INVENTORY! 🎉`
          : `Batch ${selectedBatchForQC.batchNumber} REJECTED (QUARANTINED) ⚠️`
      );

      setQcModalOpen(false);
      setSelectedBatchForQC(null);
      fetchQCData();
    } catch (err) {
      toast.error(err.response?.data?.message || "QC inspection submission failed");
    } finally {
      setSubmittingQC(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Quality Control & Lab Portal...</p>
        </div>
      </div>
    );
  }

  const pendingLeaves = summaryData?.pendingLeaves || [];
  const todayAttendance = summaryData?.todayAttendance || [];
  const deptSpecific = summaryData?.departmentSpecific || {};
  const pendingBatches = pendingBatchesList.length > 0 ? pendingBatchesList : (deptSpecific.pendingBatches || []);

  const passedCount = deptSpecific.passedCount || qcHistory.filter((q) => q.result === "pass").length;
  const failedCount = deptSpecific.failedCount || qcHistory.filter((q) => q.result === "fail").length;
  const totalInspected = passedCount + failedCount;
  const passRate = totalInspected > 0 ? Math.round((passedCount / totalInspected) * 100) : 100;

  const qcChartData = [
    { name: "Passed (Released)", value: passedCount },
    { name: "Failed (Rejected)", value: failedCount }
  ].filter((d) => d.value > 0);

  const filteredHistory = qcHistory.filter((item) => {
    if (!search) return true;
    return (
      item.batch?.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.remarks?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-teal-950/60 via-emerald-950/40 to-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 size={14} /> Quality Assurance & Analytical Testing Laboratory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Quality Control (QC) & QA Hub 🔬
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Chemical Assay Validation, Dissolution Profiling, Batch Release Authorization, and QA Audits
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

      {/* 2. Top QC KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Pending Testing" value={pendingBatches.length} icon={<Beaker size={18} />} color="amber" subtitle="Awaiting Lab Clearance" />
        <KpiCard title="Passed Batches" value={passedCount} icon={<CheckCircle2 size={18} />} color="emerald" subtitle="Released to Stock" />
        <KpiCard title="Failed Batches" value={failedCount} icon={<AlertCircle size={18} />} color="rose" subtitle="Quarantined / Rejected" />
        <KpiCard title="Quality Rate" value={`${passRate}%`} icon={<TrendingUp size={18} />} color="teal" subtitle="Compliance Index" />
        <KpiCard title="QC Analysts" value={summaryData?.presentToday || 0} icon={<Users size={18} />} color="indigo" subtitle={`Team: ${summaryData?.teamSize || 0}`} />
        <KpiCard title="Pending Leaves" value={pendingLeaves.length} icon={<Briefcase size={18} />} color="purple" subtitle="Approval Queue" />
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "pending" ? "bg-emerald-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Beaker size={14} /> Pending Lab Inspections ({pendingBatches.length})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "history" ? "bg-teal-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <FileCheck size={14} /> CoA Inspection History ({qcHistory.length})
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "team" ? "bg-indigo-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Users size={14} /> Laboratory Staff Operations ({todayAttendance.length})
        </button>
      </div>

      {/* 4. TAB 1: PENDING LAB INSPECTIONS QUEUE */}
      {activeTab === "pending" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Microscope size={18} className="text-emerald-400" />
                  Manufactured Batches Awaiting Chemical Analysis
                </h3>
                <p className="text-xs text-slate-400">Perform chemical assays, dissolution and microbial tests to release stock</p>
              </div>
              <span className="text-xs text-amber-400 font-semibold">{pendingBatches.length} pending</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Product Formulation</th>
                    <th className="p-3">Batch Size</th>
                    <th className="p-3">Mfg Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingBatches.length > 0 ? (
                    pendingBatches.map((batch) => (
                      <tr key={batch._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-amber-300">{batch.batchNumber}</td>
                        <td className="p-3 font-semibold text-slate-200">{batch.product?.name || "Product"}</td>
                        <td className="p-3 font-mono text-indigo-300 font-bold">{batch.quantity?.toLocaleString()} units</td>
                        <td className="p-3 text-slate-400">{new Date(batch.manufactureDate || Date.now()).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedBatchForQC(batch);
                              setQcForm({
                                result: "pass",
                                assayPurity: "99.4",
                                dissolutionRate: "92",
                                disintegrationTime: "4.5",
                                microbialStatus: "Pass (<10 CFU/g)",
                                remarks: "Meets all IP/BP/USP pharmacopoeial quality release standards."
                              });
                              setQcModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-bold shadow transition flex items-center gap-1.5 ml-auto"
                          >
                            <TestTube size={13} /> Perform Lab Assay
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        No batches currently awaiting quality inspection. All batches released!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Ratio Doughnut Chart */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-base mb-1">Quality Inspection Ratio</h3>
              <p className="text-xs text-slate-400">Pass vs Fail laboratory outcomes</p>
            </div>

            <div className="h-48 my-2">
              {qcChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qcChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
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
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No QC test history yet
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-800">
              <div>
                <p className="text-emerald-400 font-bold text-base">{passedCount}</p>
                <p className="text-slate-400 text-[10px]">Passed Batches</p>
              </div>
              <div>
                <p className="text-rose-400 font-bold text-base">{failedCount}</p>
                <p className="text-slate-400 text-[10px]">Failed Batches</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: CoA INSPECTION HISTORY */}
      {activeTab === "history" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileCheck size={18} className="text-teal-400" />
                Certificate of Analysis (CoA) Laboratory Archive
              </h3>
              <p className="text-xs text-slate-400">Official chemical analysis, dissolution, and microbial audit logs</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search batch or remarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>
              <button
                onClick={exportQCCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={exportQCPDF}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileText size={13} /> Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Assay Result</th>
                  <th className="p-3">Analytical Lab Findings & Parameters</th>
                  <th className="p-3">Verified By</th>
                  <th className="p-3">Inspection Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-slate-200">{item.batch?.batchNumber || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.result === "pass"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}>
                          {item.result === "pass" ? "✅ PASSED (RELEASED)" : "❌ FAILED (QUARANTINED)"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-md">{item.remarks}</td>
                      <td className="p-3 text-slate-400">{item.checkedBy?.name || "QC Analyst"}</td>
                      <td className="p-3 text-slate-400">{new Date(item.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No historical QC reports found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 3: LABORATORY STAFF OPERATIONS */}
      {activeTab === "team" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leave Approvals */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-400" />
                QC Analyst Leave Approvals
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
                        <span className="capitalize font-semibold text-emerald-400">{leave.type} Leave</span> (
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
                  No pending leave approval requests from QC staff.
                </div>
              )}
            </div>
          </div>

          {/* QC Attendance Today */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 size={18} className="text-indigo-400" />
                QC Staff Attendance Today
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
                        No QC staff attendance logged today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QC CERTIFICATE OF ANALYSIS (CoA) TESTING FORM */}
      {qcModalOpen && selectedBatchForQC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Microscope size={18} className="text-emerald-400" />
                Laboratory Assay & CoA Release Test
              </h3>
              <button onClick={() => setQcModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Batch: <span className="text-amber-400 font-mono font-bold">{selectedBatchForQC.batchNumber}</span> • {selectedBatchForQC.product?.name} ({selectedBatchForQC.quantity} units)
            </p>

            <form onSubmit={handleInspectQC} className="space-y-4">
              {/* Disposition Selector */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Batch Quality Disposition</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setQcForm({ ...qcForm, result: "pass", remarks: "Meets all IP/BP/USP pharmacopoeial quality release standards." })}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      qcForm.result === "pass" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 size={16} /> PASS (Release to Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQcForm({ ...qcForm, result: "fail", remarks: "Out of specification. Assay below limits. Non-conformance quarantined." })}
                    className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      qcForm.result === "fail" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <AlertCircle size={16} /> FAIL (Quarantine / Reject)
                  </button>
                </div>
              </div>

              {/* Lab Analytical Parameters */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Analytical Quality Parameters</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Chemical Assay % (95-105%)</label>
                    <input
                      type="text"
                      value={qcForm.assayPurity}
                      onChange={(e) => setQcForm({ ...qcForm, assayPurity: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Dissolution Rate % (30m)</label>
                    <input
                      type="text"
                      value={qcForm.dissolutionRate}
                      onChange={(e) => setQcForm({ ...qcForm, dissolutionRate: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Disintegration (Minutes)</label>
                    <input
                      type="text"
                      value={qcForm.disintegrationTime}
                      onChange={(e) => setQcForm({ ...qcForm, disintegrationTime: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Microbial Sterility Test</label>
                    <input
                      type="text"
                      value={qcForm.microbialStatus}
                      onChange={(e) => setQcForm({ ...qcForm, microbialStatus: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Analyst Notes & Certification</label>
                <textarea
                  value={qcForm.remarks}
                  onChange={(e) => setQcForm({ ...qcForm, remarks: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none h-20"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQcModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQC}
                  className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow transition ${
                    qcForm.result === "pass" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {submittingQC ? "Submitting..." : qcForm.result === "pass" ? "Confirm & Release Stock" : "Confirm Quarantine"}
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
          fetchQCData();
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

export default QCDashboard;
