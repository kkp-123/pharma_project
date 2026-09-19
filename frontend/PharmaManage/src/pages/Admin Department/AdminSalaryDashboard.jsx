import React, { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { generatePayslipPDF } from "../../utils/payslipGenerator";

import {
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  Download,
  FileText,
  Search,
  RefreshCw,
  Edit,
  ShieldCheck,
  Send,
  X,
  ChevronRight,
  TrendingUp,
  Percent
} from "lucide-react";

const AdminSalaryDashboard = () => {
  const [data, setData] = useState({
    month: new Date().toISOString().slice(0, 7),
    stats: { totalEmployees: 0, generated: 0, paidCount: 0, totalPayrollCost: 0, totalDisbursed: 0, totalPending: 0 },
    salaries: []
  });

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [department, setDepartment] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [disbursingAll, setDisbursingAll] = useState(false);

  // Recalculation & Preview Modal
  const [recalcModalOpen, setRecalcModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Custom adjustments state
  const [customBonus, setCustomBonus] = useState(0);
  const [customOvertime, setCustomOvertime] = useState(0);
  const [customTax, setCustomTax] = useState(0);
  const [customPF, setCustomPF] = useState(null);
  const [customMethod, setCustomMethod] = useState("bank_transfer");

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/salary/all?month=${month}`);
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load corporate salary ledger");
      setData({ month, stats: {}, salaries: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [month]);

  // Open Preview / Recalculation Modal
  const handleOpenRecalc = async (empData) => {
    setSelectedEmp(empData);
    setCustomBonus(empData.salaryRecord?.bonus || 0);
    setCustomOvertime(empData.salaryRecord?.overtime || 0);
    setCustomTax(empData.salaryRecord?.tax || 0);
    setCustomPF(empData.salaryRecord?.pf || null);
    setCustomMethod(empData.salaryRecord?.paymentMethod || "bank_transfer");
    setRecalcModalOpen(true);
    await triggerPreview(empData.user._id, {
      bonus: empData.salaryRecord?.bonus || 0,
      overtime: empData.salaryRecord?.overtime || 0,
      tax: empData.salaryRecord?.tax || 0,
      pf: empData.salaryRecord?.pf || null
    });
  };

  // Trigger Real-Time Calculation Preview
  const triggerPreview = async (employeeId, overrides = {}) => {
    try {
      setPreviewLoading(true);
      const res = await api.post("/salary/preview", {
        employeeId,
        month,
        bonus: overrides.bonus !== undefined ? overrides.bonus : customBonus,
        overtime: overrides.overtime !== undefined ? overrides.overtime : customOvertime,
        tax: overrides.tax !== undefined ? overrides.tax : customTax,
        pf: overrides.pf !== undefined ? overrides.pf : customPF
      });
      setPreviewData(res.data.calculation);
    } catch (err) {
      toast.error("Failed to calculate pro-rata salary preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save / Disburse Single Salary
  const handleSaveSalary = async () => {
    if (!selectedEmp) return;
    try {
      setPreviewLoading(true);
      const res = await api.post("/salary/generate", {
        employeeId: selectedEmp.user._id,
        month,
        bonus: Number(customBonus || 0),
        overtime: Number(customOvertime || 0),
        tax: Number(customTax || 0),
        pf: customPF !== null ? Number(customPF) : undefined,
        paymentMethod: customMethod
      });
      toast.success(res.data.message || "Salary slip compiled successfully!");
      setRecalcModalOpen(false);
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate employee salary");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Generate All Real-time
  const handleGenerateAll = async () => {
    try {
      setGeneratingAll(true);
      const res = await api.post("/salary/generate-all", { month });
      toast.success(res.data.message || `Payroll batch generated for ${month}`);
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Batch payroll generation failed");
    } finally {
      setGeneratingAll(false);
    }
  };

  // Disburse Single
  const handleMarkPaid = async (salaryId) => {
    try {
      await api.put(`/salary/pay/${salaryId}`, { paymentMethod: "bank_transfer" });
      toast.success("Salary marked as Disbursed / Paid!");
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment status update failed");
    }
  };

  // Bulk Disburse All
  const handleBulkDisburse = async () => {
    if (!window.confirm(`Disburse all pending salary transfers for month ${month}?`)) return;
    try {
      setDisbursingAll(true);
      const res = await api.post("/salary/bulk-pay", { month, paymentMethod: "bank_transfer" });
      toast.success(res.data.message || "Bulk payroll disbursed!");
      fetchSalaries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk disbursement failed");
    } finally {
      setDisbursingAll(false);
    }
  };

  // Filter Salaries
  const filteredData = (data.salaries || []).filter((item) => {
    if (department !== "ALL" && item.user.department !== department) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.user.name?.toLowerCase().includes(q) || item.user.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const { totalEmployees = 0, generated = 0, paidCount = 0, totalPayrollCost = 0, totalDisbursed = 0, totalPending = 0 } = data.stats || {};

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck size={16} /> Enterprise Corporate Compensation Engine
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Real-Time Payroll & Compensation Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Attendance pro-rata deductions, CTC component breakdowns (Basic, HRA, DA, PF, TDS), and payslips.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 gap-2">
            <Building2 size={14} className="text-slate-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              <option value="ALL" className="invert-bg">All Departments</option>
              <option value="Sales" className="invert-bg">Sales</option>
              <option value="Production" className="invert-bg">Production</option>
              <option value="QC" className="invert-bg">QC Department</option>
              <option value="Inventory" className="invert-bg">Inventory</option>
              <option value="HR" className="invert-bg">HR</option>
            </select>
          </div>

          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={generatingAll ? "animate-spin" : ""} />
            Generate All Salaries
          </button>

          <button
            onClick={handleBulkDisburse}
            disabled={disbursingAll || totalPending <= 0}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition disabled:opacity-30"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            Disburse All Paid
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-medium">Total Monthly Payroll</p>
            <h3 className="text-2xl font-bold text-white mt-1">₹{totalPayrollCost.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-400 mt-1">{generated} of {totalEmployees} generated</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-medium">Total Disbursed (Paid)</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">₹{totalDisbursed.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{paidCount} employees paid</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-medium">Pending Disbursement</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">₹{totalPending.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{generated - paidCount} pending bank</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-medium">Active Workforce</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalEmployees} Members</h3>
            <p className="text-[11px] text-indigo-400 mt-1">100% Pro-Rata Coverage</p>
          </div>
          <div className="p-3 bg-slate-800 text-slate-400 rounded-xl border border-slate-700">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6 flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md">
        <Search size={16} className="text-slate-500 mr-2.5" />
        <input
          type="text"
          placeholder="Search employee by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-white w-full focus:outline-none"
        />
      </div>

      {/* ROSTER GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <motion.div
            key={item.user._id}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between backdrop-blur-md"
          >
            <div>
              {/* Card Top */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {item.user.name}
                  </h2>
                  <p className="text-slate-400 text-xs">{item.user.email}</p>
                </div>

                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    item.status === "PAID"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : item.status === "GENERATED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {item.status === "PAID" ? "✅ Disbursed" : item.status === "GENERATED" ? "⏳ In Review" : "⚠️ Not Compiled"}
                </span>
              </div>

              {/* Tag Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] bg-slate-800 px-2.5 py-0.5 rounded-md text-slate-300">
                  {item.user.department}
                </span>
                <span className="text-[10px] bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 rounded-md text-indigo-300">
                  Base CTC: ₹{(item.user.salary || 30000).toLocaleString()}
                </span>
              </div>

              {/* Metrics Summary */}
              {item.salaryRecord ? (
                <div className="text-xs space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic Pay (50%):</span>
                    <span>₹{item.salaryRecord.basicPay?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">HRA + Allowances:</span>
                    <span>₹{((item.salaryRecord.hra || 0) + (item.salaryRecord.specialAllowance || 0))?.toLocaleString()}</span>
                  </div>
                  {item.salaryRecord.bonus > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Performance Bonus:</span>
                      <span>+₹{item.salaryRecord.bonus?.toLocaleString()}</span>
                    </div>
                  )}
                  {item.salaryRecord.attendanceDeduction > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Attendance Deduction:</span>
                      <span>-₹{item.salaryRecord.attendanceDeduction?.toLocaleString()}</span>
                    </div>
                  )}
                  {item.salaryRecord.pf > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>PF (12%):</span>
                      <span>-₹{item.salaryRecord.pf?.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                    <span className="text-white">Net Take-Home:</span>
                    <span className="text-emerald-400 text-base">₹{item.salaryRecord.netSalary?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/50 mb-4 text-center text-xs text-slate-500">
                  Real-time payroll calculation awaiting compilation.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenRecalc(item)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                >
                  <Edit size={13} className="text-indigo-400" />
                  {item.salaryRecord ? "Recalculate / Adjust" : "Calculate & Preview"}
                </button>

                {item.salaryRecord && (
                  <button
                    onClick={() => generatePayslipPDF(item.salaryRecord, item.user)}
                    className="px-3 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 text-emerald-400 transition"
                    title="Download Official PDF Payslip"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>

              {item.salaryRecord && !item.salaryRecord.isPaid && (
                <button
                  onClick={() => handleMarkPaid(item.salaryRecord._id)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition"
                >
                  <Send size={13} />
                  Disburse & Mark as Paid
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* RECALCULATION & REAL-TIME PREVIEW MODAL */}
      <AnimatePresence>
        {recalcModalOpen && selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-emerald-400" size={20} />
                    Salary Adjustments & Real-Time CTC Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedEmp.user.name} ({selectedEmp.user.department}) • Month: {month}
                  </p>
                </div>
                <button onClick={() => setRecalcModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Live Pro-Rata Attendance Audit Banner */}
                {previewData && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="text-slate-500">Working Days</p>
                      <p className="font-bold text-white text-sm mt-0.5">{previewData.workingDays}</p>
                    </div>
                    <div>
                      <p className="text-emerald-400">Present Days</p>
                      <p className="font-bold text-emerald-400 text-sm mt-0.5">{previewData.presentDays}</p>
                    </div>
                    <div>
                      <p className="text-rose-400">Absent Days</p>
                      <p className="font-bold text-rose-400 text-sm mt-0.5">{previewData.absentDays}</p>
                    </div>
                    <div>
                      <p className="text-amber-400">Overtime Hrs</p>
                      <p className="font-bold text-amber-400 text-sm mt-0.5">{previewData.overtimeHours}h</p>
                    </div>
                  </div>
                )}

                {/* Adjustments Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Performance Bonus (₹)</label>
                    <input
                      type="number"
                      value={customBonus}
                      onChange={(e) => {
                        setCustomBonus(Number(e.target.value));
                        triggerPreview(selectedEmp.user._id, { bonus: Number(e.target.value) });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Overtime Pay (₹)</label>
                    <input
                      type="number"
                      value={customOvertime}
                      onChange={(e) => {
                        setCustomOvertime(Number(e.target.value));
                        triggerPreview(selectedEmp.user._id, { overtime: Number(e.target.value) });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">TDS / Income Tax (₹)</label>
                    <input
                      type="number"
                      value={customTax}
                      onChange={(e) => {
                        setCustomTax(Number(e.target.value));
                        triggerPreview(selectedEmp.user._id, { tax: Number(e.target.value) });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Payment Method</label>
                    <select
                      value={customMethod}
                      onChange={(e) => setCustomMethod(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="bank_transfer" className="invert-bg">Bank Transfer (NEFT/RTGS)</option>
                      <option value="upi" className="invert-bg">Direct UPI / Corporate IMPS</option>
                      <option value="cheque" className="invert-bg">Company Cheque</option>
                      <option value="cash" className="invert-bg">Petty Cash Voucher</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Breakdown Preview */}
                {previewData && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-white text-sm mb-3">Live Compensation CTC Breakdown</h4>
                    <div className="flex justify-between text-slate-400">
                      <span>Gross CTC:</span>
                      <span className="text-white font-semibold">₹{previewData.grossSalary?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Basic Pay:</span>
                      <span>₹{previewData.basicPay?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>House Rent Allowance (HRA):</span>
                      <span>₹{previewData.hra?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Dearness Allowance (DA):</span>
                      <span>₹{previewData.da?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Special Allowances:</span>
                      <span>₹{previewData.specialAllowance?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Attendance Deduction:</span>
                      <span>-₹{previewData.attendanceDeduction?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Provident Fund (12%):</span>
                      <span>-₹{previewData.pf?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Tax (TDS):</span>
                      <span>-₹{previewData.tax?.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between pt-3 border-t border-slate-800 text-base font-extrabold text-white">
                      <span>Net Disbursable Take-Home:</span>
                      <span className="text-emerald-400">₹{previewData.netSalary?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/60">
                <button
                  onClick={() => setRecalcModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSalary}
                  disabled={previewLoading}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
                >
                  Save & Compile Payslip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSalaryDashboard;
