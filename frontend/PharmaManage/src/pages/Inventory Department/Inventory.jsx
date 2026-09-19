import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import FaceAttendanceModal from "../../components/FaceAttendanceModal";

import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ScanFace,
  Building2,
  Users,
  Search,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Zap,
  Filter,
  X,
  Boxes,
  ShieldCheck,
  RefreshCw,
  LogIn,
  LogOut
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Inventory = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [summaryData, setSummaryData] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [expiringList, setExpiringList] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState("stock"); // "stock" | "expiring" | "low_stock" | "adjustment" | "team"
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [expiryDays, setExpiryDays] = useState(30);

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

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [demandModalOpen, setDemandModalOpen] = useState(false);
  const [duplicateConfirmModal, setDuplicateConfirmModal] = useState({
    open: false,
    message: "",
    productId: "",
    productName: "",
    quantity: 10000,
    notes: ""
  });

  // Selected item states
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: "in", quantity: "", reason: "" });
  const [demandForm, setDemandForm] = useState({ productId: "", productName: "", quantity: 10000, notes: "" });
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [summaryRes, invRes, expRes, lowRes, attendanceStatusRes] = await Promise.all([
        api.get(`/dashboard/manager/summary?department=Inventory&month=${month}`),
        api.get("/inventory").catch(() => ({ data: { inventories: [] } })),
        api.get(`/inventory/expiring?days=${expiryDays}`).catch(() => ({ data: { expiring: [] } })),
        api.get("/inventory/low-stock").catch(() => ({ data: { lowStock: [] } })),
        api.get("/attendance/today-status").catch(() => ({ data: { checkedIn: false, checkedOut: false } }))
      ]);

      setSummaryData(summaryRes.data);
      setInventoryList(invRes.data?.inventories || (Array.isArray(invRes.data) ? invRes.data : []));
      setExpiringList(expRes.data?.expiring || (Array.isArray(expRes.data) ? expRes.data : []));
      setLowStockList(lowRes.data?.lowStock || (Array.isArray(lowRes.data) ? lowRes.data : []));
      setMyAttendanceStatus(attendanceStatusRes.data || { checkedIn: false, checkedOut: false });
    } catch (err) {
      console.error("Inventory dashboard fetch error:", err);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [month, expiryDays]);

  // Leave Action
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leave/status/${leaveId}`, { status });
      toast.success(`Leave request marked as ${status}`);
      fetchInventoryData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update leave status");
    }
  };

  // Stock Adjustment Submit
  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedInventory || !adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
      return toast.error("Please enter a valid positive quantity");
    }

    try {
      setSubmittingAction(true);
      const res = await api.post("/inventory/adjust", {
        inventoryId: selectedInventory._id,
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason
      });

      toast.success(res.data.message || "Stock adjusted successfully");
      setAdjustModalOpen(false);
      setSelectedInventory(null);
      setAdjustForm({ type: "in", quantity: "", reason: "" });
      fetchInventoryData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust stock");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Create Production Demand from Low Stock
  const handleCreateDemand = async (e, force = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const pid = force ? duplicateConfirmModal.productId : demandForm.productId;
    const pname = force ? duplicateConfirmModal.productName : demandForm.productName;
    const qty = force ? duplicateConfirmModal.quantity : demandForm.quantity;
    const notes = force ? duplicateConfirmModal.notes : demandForm.notes;

    if (!pid || !qty) {
      return toast.error("Please select a product and valid demand quantity");
    }

    try {
      setSubmittingAction(true);
      const res = await api.post("/inventory/create-demand", {
        productId: pid,
        quantity: Number(qty),
        notes: notes || "Generated from Warehouse Low Stock Alert",
        force
      });

      if (res.data?.requiresConfirmation) {
        setDemandModalOpen(false);
        setDuplicateConfirmModal({
          open: true,
          message: res.data.message,
          productId: pid,
          productName: pname,
          quantity: qty,
          notes
        });
        return;
      }

      toast.success(res.data.message || "Production Demand sent to manufacturing line!");
      setDemandModalOpen(false);
      setDuplicateConfirmModal({ open: false, message: "", productId: "", productName: "", quantity: 10000, notes: "" });
      setDemandForm({ productId: "", productName: "", quantity: 10000, notes: "" });
      fetchInventoryData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create production demand");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Industrial Warehouse Portal...</p>
        </div>
      </div>
    );
  }

  const pendingLeaves = summaryData?.pendingLeaves || [];
  const todayAttendance = summaryData?.todayAttendance || [];
  const deptSpecific = summaryData?.departmentSpecific || {};

  // Filter Inventory
  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch =
      !search ||
      item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.batch?.batchNumber?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "ALL" || item.product?.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalStockUnits = inventoryList.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const chartData = inventoryList.slice(0, 8).map((inv) => ({
    name: inv.product?.name || "Product",
    quantity: inv.quantity || 0
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-teal-950/60 via-cyan-950/40 to-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 size={14} /> Warehouse Logistics & Storage Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Industrial Inventory & Warehouse 📦
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Live Warehouse Batches, Storage Classification, Expiry Alerts, and Auto-Demand Replenishment
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
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
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

      {/* 2. Top Industrial KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Stored Units" value={totalStockUnits.toLocaleString()} icon={<Boxes size={18} />} color="teal" subtitle="Active Warehouse Units" />
        <KpiCard title="Expiring (30-60d)" value={expiringList.length} icon={<AlertTriangle size={18} />} color="amber" subtitle="Requires Clearance" />
        <KpiCard title="Low Stock Alerts" value={lowStockList.length} icon={<TrendingDown size={18} />} color="rose" subtitle="Below Threshold" />
        <KpiCard title="Batches Stored" value={inventoryList.length} icon={<Package size={18} />} color="indigo" subtitle="Active Batches" />
        <KpiCard title="Warehouse Staff" value={summaryData?.presentToday || 0} icon={<Users size={18} />} color="blue" subtitle={`Team: ${summaryData?.teamSize || 0}`} />
        <KpiCard title="Pending Leaves" value={pendingLeaves.length} icon={<Briefcase size={18} />} color="purple" subtitle="Approval Queue" />
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "stock" ? "bg-teal-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Package size={14} /> Warehouse Stock Grid ({inventoryList.length})
        </button>

        <button
          onClick={() => setActiveTab("expiring")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "expiring" ? "bg-amber-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle size={14} /> Expiring Batches ({expiringList.length})
        </button>

        <button
          onClick={() => setActiveTab("low_stock")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "low_stock" ? "bg-rose-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Zap size={14} /> Low Stock & Auto-Reorder ({lowStockList.length})
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "team" ? "bg-indigo-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Users size={14} /> Warehouse Staff Operations ({todayAttendance.length})
        </button>
      </div>

      {/* 4. TAB 1: ALL WAREHOUSE STOCK GRID */}
      {activeTab === "stock" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search formulation or batch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-slate-300 outline-none"
              >
                <option value="ALL">All Dosage Types</option>
                <option value="Tablet">Tablets</option>
                <option value="Capsule">Capsules</option>
                <option value="Syrup">Syrups</option>
                <option value="Injection">Injections</option>
                <option value="Ointment">Ointments</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredInventory.length} stored batches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Product Formulation</th>
                  <th className="p-3">Dosage Type</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Available Stock</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const isLow = item.quantity <= 1000;
                    const isNearExpiry = new Date(item.expiryDate) <= new Date(Date.now() + 45 * 86400000);

                    return (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-200">
                          {item.product?.name}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {item.product?.type || "Tablet"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {item.batch?.batchNumber || "-"}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-300">
                          {item.quantity?.toLocaleString()} units
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          ₹{item.product?.price?.toFixed(2) || "0.00"}
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${isNearExpiry ? "text-amber-400" : "text-slate-300"}`}>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Low Stock
                            </span>
                          ) : isNearExpiry ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Expiring Soon
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedInventory(item);
                              setAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white rounded-lg text-[11px] font-semibold transition border border-teal-500/30"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      No inventory records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 2: EXPIRING & CLEARANCE BATCHES */}
      {activeTab === "expiring" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                Near-Expiry Batch Clearance Monitor
              </h3>
              <p className="text-xs text-slate-400">
                Pharmaceutical batches approaching expiration threshold requiring prioritized distribution
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Window:</span>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-xl text-white outline-none"
              >
                <option value={30}>Next 30 Days</option>
                <option value={60}>Next 60 Days</option>
                <option value={90}>Next 90 Days</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Product Formulation</th>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Remaining Stock</th>
                  <th className="p-3">Mfg Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Days Remaining</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expiringList.length > 0 ? (
                  expiringList.map((item) => {
                    const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-200">{item.product?.name}</td>
                        <td className="p-3 font-mono text-slate-400">{item.batch?.batchNumber || "-"}</td>
                        <td className="p-3 font-mono font-bold text-amber-300">{item.quantity?.toLocaleString()} units</td>
                        <td className="p-3 text-slate-400">{new Date(item.manufactureDate || Date.now()).toLocaleDateString()}</td>
                        <td className="p-3 text-amber-400 font-bold">{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            daysLeft <= 15 ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedInventory(item);
                              setAdjustForm({ type: "write_off", quantity: item.quantity, reason: "Quarantined near-expiry stock" });
                              setAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-[11px] font-semibold transition border border-amber-500/30"
                          >
                            Quarantine Batch
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No batches expiring within the next {expiryDays} days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 3: LOW STOCK & AUTO-REORDER */}
      {activeTab === "low_stock" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Zap size={18} className="text-rose-400" />
                Low Stock Alerts & Auto-Demand Trigger
              </h3>
              <p>
  Formulations below safety threshold ('$&lt; 1,000 units') requiring immediate manufacturing replenishment
</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Product Formulation</th>
                  <th className="p-3">Dosage Type</th>
                  <th className="p-3">Current Available Stock</th>
                  <th className="p-3">Safety Threshold</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lowStockList.length > 0 ? (
                  lowStockList.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-slate-200">{item.productName}</td>
                      <td className="p-3 text-slate-400">{item.productType || "Tablet"}</td>
                      <td className="p-3 font-mono font-bold text-rose-400">{item.totalQuantity?.toLocaleString()} units</td>
                      <td className="p-3 font-mono text-slate-400">1,000 units</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Critical Low
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setDemandForm({
                              productId: item._id,
                              productName: item.productName,
                              quantity: 25000,
                              notes: `Auto-replenish order for ${item.productName}`
                            });
                            setDemandModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold shadow transition flex items-center gap-1.5 ml-auto"
                        >
                          <Zap size={13} /> Trigger Production Demand
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      All products currently have optimal warehouse buffer stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 4: WAREHOUSE STAFF OPERATIONS */}
      {activeTab === "team" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leave Approvals */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-400" />
                Warehouse Staff Leave Approvals
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
                        <span className="capitalize font-semibold text-teal-400">{leave.type} Leave</span> (
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
                  No pending leave approval requests from warehouse personnel.
                </div>
              )}
            </div>
          </div>

          {/* Team Attendance Today */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 size={18} className="text-teal-400" />
                Warehouse Staff Attendance Today
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
                        No warehouse staff attendance logged today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: STOCK ADJUSTMENT */}
      {adjustModalOpen && selectedInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">Warehouse Stock Adjustment</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Formulation: <span className="text-teal-400 font-bold">{selectedInventory.product?.name}</span> • Batch: {selectedInventory.batch?.batchNumber}
            </p>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: "in" })}
                    className={`py-2 rounded-xl transition ${
                      adjustForm.type === "in" ? "bg-emerald-600 text-white shadow" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Stock In (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: "out" })}
                    className={`py-2 rounded-xl transition ${
                      adjustForm.type === "out" ? "bg-amber-600 text-white shadow" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Stock Out (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: "write_off" })}
                    className={`py-2 rounded-xl transition ${
                      adjustForm.type === "write_off" ? "bg-rose-600 text-white shadow" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Write-off
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Adjustment Quantity (Units)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Audit Justification / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. QA Laboratory Sample deduction, Physical Audit discrepancy"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingAction ? "Saving..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AUTO PRODUCTION DEMAND TRIGGER */}
      {demandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Zap size={18} className="text-rose-400" />
                Trigger Manufacturing Demand
              </h3>
              <button onClick={() => setDemandModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Send immediate production schedule request to the Production Department floor.
            </p>

            <form onSubmit={handleCreateDemand} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Formulation</label>
                <input
                  type="text"
                  value={demandForm.productName}
                  disabled
                  className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-teal-300 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Required Batch Size (Units)</label>
                <input
                  type="number"
                  value={demandForm.quantity}
                  onChange={(e) => setDemandForm({ ...demandForm, quantity: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Priority Notes / Requirement</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent warehouse low stock replenishment"
                  value={demandForm.notes}
                  onChange={(e) => setDemandForm({ ...demandForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDemandModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingAction ? "Sending..." : "Dispatch Demand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DUPLICATE DEMAND CONFIRMATION POPUP */}
      {duplicateConfirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Active Production Demand Exists
                </h3>
                <p className="text-xs text-amber-300 font-medium mt-0.5">
                  Duplicate Request Prevention Notice
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
              <p>{duplicateConfirmModal.message}</p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                <span>New Requested Size:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Number(duplicateConfirmModal.quantity).toLocaleString()} units
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() =>
                  setDuplicateConfirmModal({ open: false, message: "", productId: "", productName: "", quantity: 10000, notes: "" })
                }
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel / Keep Existing
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleCreateDemand(null, true)}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                {submittingAction ? "Processing..." : "Create Another Demand"}
              </button>
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
          fetchInventoryData();
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

export default Inventory;