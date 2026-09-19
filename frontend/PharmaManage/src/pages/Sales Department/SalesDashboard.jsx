import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import FaceAttendanceModal from "../../components/FaceAttendanceModal";

import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ScanFace,
  Building2,
  Clock,
  PlusCircle,
  Search,
  FileText,
  X,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Package,
  Trash2,
  LogIn,
  LogOut,
  Download
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



const SalesDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [summaryData, setSummaryData] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventoryStock, setInventoryStock] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Tabs: "orders" | "inventory" | "forecast" | "analytics" | "team"
  const [activeTab, setActiveTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
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

  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  // New Sale Form
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    productId: "",
    quantity: 5000,
    price: 0,
    discount: 5,
    paidAmount: 0
  });

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentNote, setPaymentNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [summaryRes, salesRes, productsRes, inventoryRes, attendanceStatusRes, forecastRes] = await Promise.all([
        api.get(`/dashboard/manager/summary?department=Sales&month=${month}`),
        api.get("/sales").catch(() => ({ data: { sales: [] } })),
        api.get("/products/all").catch(() => ({ data: [] })),
        api.get("/inventory").catch(() => ({ data: [] })),
        api.get("/attendance/today-status").catch(() => ({ data: { checkedIn: false, checkedOut: false } })),
        api.get("/forecast/sales-next-month").catch(() => ({ data: null }))
      ]);

      setSummaryData(summaryRes.data);
      setSalesOrders(salesRes.data?.sales || (Array.isArray(salesRes.data) ? salesRes.data : []));
      setProducts(productsRes.data?.products || (Array.isArray(productsRes.data) ? productsRes.data : []));
      setInventoryStock(inventoryRes.data?.inventories || (Array.isArray(inventoryRes.data) ? inventoryRes.data : []));
      setMyAttendanceStatus(attendanceStatusRes.data || { checkedIn: false, checkedOut: false });
      setForecastData(forecastRes.data);
    } catch (err) {
      console.error("Sales dashboard fetch error:", err);
      toast.error("Failed to load Sales dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Export Sales Orders to CSV
  const exportSalesCSV = () => {
    if (salesOrders.length === 0) return toast.error("No sales orders to export");

    const headers = ["Invoice #", "Customer", "Company", "Total Amount", "Paid", "Due", "Status", "Date"];
    const rows = salesOrders.map((s) => [
      s.invoiceNumber || s._id,
      `"${s.customerName || ""}"`,
      `"${s.companyName || ""}"`,
      s.totalAmount || 0,
      s.paidAmount || 0,
      s.dueAmount || 0,
      s.status || "pending",
      new Date(s.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Commercial_Sales_Report_${month}.csv`);
    link.click();
  };

  // Export Sales Orders to PDF
  const exportSalesPDF = () => {
    if (salesOrders.length === 0) return toast.error("No sales orders to export");

    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("COMMERCIAL SALES & REVENUE REPORT", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const totalRev = salesOrders.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = salesOrders.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    doc.text(`Period: ${month} | Total Orders: ${salesOrders.length} | Revenue: INR ${totalRev.toLocaleString()} | Collected: INR ${totalPaid.toLocaleString()}`, 14, 23);

    autoTable(doc, {
      startY: 35,
      head: [["Invoice", "Customer", "Company", "Total", "Paid", "Due", "Status", "Date"]],
      body: salesOrders.map((s) => [
        s.invoiceNumber ? s.invoiceNumber.slice(-8) : s._id.slice(-6),
        s.customerName || "N/A",
        s.companyName || "N/A",
        `INR ${(s.totalAmount || 0).toLocaleString()}`,
        `INR ${(s.paidAmount || 0).toLocaleString()}`,
        `INR ${(s.dueAmount || 0).toLocaleString()}`,
        (s.status || "pending").toUpperCase(),
        new Date(s.createdAt).toLocaleDateString()
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });

    doc.save(`Sales_Report_${month}.pdf`);
  };

  useEffect(() => {
    fetchSalesData();
  }, [month]);

  // Leave Action
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leave/status/${leaveId}`, { status });
      toast.success(`Leave request ${status}`);
      fetchSalesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update leave status");
    }
  };

  // Select Product and auto-fill price
  const handleProductSelect = (prodId) => {
    const p = products.find((prod) => prod._id === prodId);
    setOrderForm({
      ...orderForm,
      productId: prodId,
      price: p?.price || 10
    });
  };

  // Submit New Sales Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customerName || !orderForm.productId || !orderForm.quantity) {
      return toast.error("Please enter customer name, product and quantity");
    }

    try {
      setSubmittingAction(true);
      const payload = {
        customerName: orderForm.customerName,
        companyName: orderForm.companyName || orderForm.customerName,
        email: orderForm.email,
        phone: orderForm.phone,
        address: orderForm.address,
        items: [
          {
            product: orderForm.productId,
            quantity: Number(orderForm.quantity),
            price: Number(orderForm.price),
            discount: Number(orderForm.discount)
          }
        ],
        paidAmount: Number(orderForm.paidAmount || 0)
      };

      const res = await api.post("/sales", payload);
      toast.success(res.data?.message || "Commercial Sales Order created successfully!");
      setCreateOrderModalOpen(false);
      setOrderForm({
        customerName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        productId: "",
        quantity: 5000,
        price: 0,
        discount: 5,
        paidAmount: 0
      });
      fetchSalesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create sales order");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Quick Stock Allocation for Single Order
  const handleQuickAllocate = async (orderId) => {
    try {
      const res = await api.post(`/sales/${orderId}/allocate`, { createDemandIfEmpty: true });
      toast.success(res.data?.message || "Stock allocation checked!");
      fetchSalesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to allocate stock");
    }
  };

  // Bulk Allocate Newly Released Product Stock to Waiting Commercial Orders
  const handleAllocateProductToWaitingOrders = async (productId, productName) => {
    try {
      const waitingOrders = salesOrders.filter((order) =>
        (order.status === "production-required" || order.status === "partial") &&
        order.items?.some((i) => (i.product?._id === productId || i.product === productId) && (i.remainingQuantity || 0) > 0)
      );

      if (waitingOrders.length === 0) {
        return toast(`No pending sales orders waiting for ${productName || "this product"}.`);
      }

      let totalUnitsAllocated = 0;
      for (const order of waitingOrders) {
        const res = await api.post(`/sales/${order._id}/allocate`, { createDemandIfEmpty: false });
        if (res.data?.newlyAllocatedTotal > 0) {
          totalUnitsAllocated += res.data.newlyAllocatedTotal;
        }
      }

      if (totalUnitsAllocated > 0) {
        toast.success(`🎉 Successfully allocated ${totalUnitsAllocated.toLocaleString()} units of ${productName} across ${waitingOrders.length} customer order(s)!`);
      } else {
        toast("Checked warehouse stock. No additional unexpired units currently available.");
      }
      fetchSalesData();
    } catch (err) {
      toast.error("Failed to allocate product stock to waiting orders");
    }
  };

  // Delete Sales Order
  const handleDeleteSale = async (orderId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete order for "${customerName}"? Any allocated inventory will be released back to warehouse stock.`)) {
      return;
    }

    try {
      const res = await api.delete(`/sales/${orderId}`);
      toast.success(res.data?.message || "Sales order deleted successfully!");
      fetchSalesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete sales order");
    }
  };

  // Submit Payment Collection
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderForPayment || !paymentAmount || Number(paymentAmount) <= 0) {
      return toast.error("Please enter a valid payment amount");
    }

    try {
      setSubmittingAction(true);
      await api.post(`/sales/${selectedOrderForPayment._id}/payment`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        note: paymentNote || "Invoice payment settlement"
      });

      toast.success(`Payment of ₹${Number(paymentAmount).toLocaleString()} recorded successfully!`);
      setPaymentModalOpen(false);
      setSelectedOrderForPayment(null);
      setPaymentAmount("");
      setPaymentNote("");
      fetchSalesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Commercial Sales & Revenue Portal...</p>
        </div>
      </div>
    );
  }

  const pendingLeaves = summaryData?.pendingLeaves || [];
  const todayAttendance = summaryData?.todayAttendance || [];
  const deptSpecific = summaryData?.departmentSpecific || {};

  const totalRevenue = salesOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalPaid = salesOrders.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalDue = totalRevenue - totalPaid;

  const filteredOrders = salesOrders.filter((order) => {
    const matchesSearch =
      !search ||
      order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      order.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      order.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const chartData = salesOrders.slice(0, 7).map((order) => ({
    name: order.customerName?.split(" ")[0] || "Client",
    revenue: order.totalAmount || 0,
    paid: order.paidAmount || 0
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-8">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-950 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 size={14} /> Commercial Sales, Hospital Distribution & Invoicing
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Sales & Revenue Management 💼
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Hospital Procurement Orders, Wholesale Distribution, Revenue Invoicing, and Payment Settlements
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
            onClick={() => setCreateOrderModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <PlusCircle size={16} /> New Sales Order
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

      {/* 2. Top Commercial KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<DollarSign size={18} />} color="emerald" subtitle="Gross Billed Value" />
        <KpiCard title="Collected Receipts" value={`₹${totalPaid.toLocaleString()}`} icon={<CheckCircle2 size={18} />} color="teal" subtitle="Settled via Bank" />
        <KpiCard title="Outstanding Dues" value={`₹${totalDue.toLocaleString()}`} icon={<CreditCard size={18} />} color="rose" subtitle="Pending Invoices" />
        <KpiCard title="Total Orders" value={salesOrders.length} icon={<ShoppingBag size={18} />} color="indigo" subtitle="Invoices Issued" />
        <KpiCard title="Sales Staff" value={summaryData?.presentToday || 0} icon={<Users size={18} />} color="blue" subtitle={`Team: ${summaryData?.teamSize || 0}`} />
        <KpiCard title="Pending Leaves" value={pendingLeaves.length} icon={<Briefcase size={18} />} color="purple" subtitle="Approval Queue" />
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "orders" ? "bg-emerald-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingBag size={14} /> Commercial Orders Pipeline ({salesOrders.length})
        </button>

        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "forecast" ? "bg-indigo-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles size={14} /> 🤖 AI Predictive Sales & Demand Forecast
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "inventory" ? "bg-amber-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Package size={14} /> Warehouse Stock Ledger ({inventoryStock.length})
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "analytics" ? "bg-teal-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp size={14} /> Revenue Performance & Invoicing Trends
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === "team" ? "bg-indigo-600 text-white shadow" : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          <Users size={14} /> Sales Representatives Operations ({todayAttendance.length})
        </button>
      </div>

      {/* 4. TAB 1: COMMERCIAL SALES ORDERS PIPELINE */}
      {activeTab === "orders" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search customer, hospital, email..."
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
                <option value="ALL">All Payment Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partial Payment</option>
                <option value="pending">Pending Payment</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportSalesCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={exportSalesPDF}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileText size={13} /> Export PDF
              </button>
              <button
                onClick={() => setCreateOrderModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <PlusCircle size={14} /> Create Order
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Client / Organization</th>
                  <th className="p-3">Total Billed</th>
                  <th className="p-3">Settled Paid</th>
                  <th className="p-3">Balance Due</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Fulfillment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const due = (order.totalAmount || 0) - (order.paidAmount || 0);

                    return (
                      <tr key={order._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-200">{order.customerName}</p>
                          <p className="text-[11px] text-slate-400">{order.companyName || order.email}</p>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          ₹{(order.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          ₹{(order.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-400">
                          ₹{due > 0 ? due.toLocaleString() : "0"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : order.paymentStatus === "partial"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}>
                            {order.paymentStatus === "paid" ? "✅ Fully Settled" : order.paymentStatus === "partial" ? "⏳ Partial" : "❌ Unpaid Due"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                            order.status === "approved" || order.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : order.status === "partial"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}>
                            {order.status === "approved" || order.status === "completed"
                              ? "✅ Stock Allocated"
                              : order.status === "partial"
                              ? "⏳ Partial Stock"
                              : "🏭 Demand Created"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(order.status === "production-required" || order.status === "partial") && (
                              <button
                                onClick={() => handleQuickAllocate(order._id)}
                                title="Check available stock in warehouse"
                                className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <Sparkles size={12} /> Allocate
                              </button>
                            )}

                            {due > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForPayment(order);
                                  setPaymentAmount(due);
                                  setPaymentModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition shadow flex items-center gap-1"
                              >
                                <Receipt size={13} /> Collect ₹{due.toLocaleString()}
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteSale(order._id, order.customerName)}
                              title="Delete Commercial Order"
                              className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No commercial sales orders found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB: REAL-TIME WAREHOUSE STOCK LEDGER & ALLOCATION */}
      {activeTab === "inventory" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Package size={18} className="text-amber-400" />
                Live Warehouse Inventory Stocks & Batches
              </h3>
              <p className="text-xs text-slate-400">
                Inspect available pharmaceutical stocks and allocate newly approved QC batches to waiting customer orders
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search formulation or batch..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Product Formulation</th>
                  <th className="p-3">Active Batch Ref</th>
                  <th className="p-3">Available Stock</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Unit Valuation</th>
                  <th className="p-3">Customer Order Demand</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventoryStock.filter((item) => {
                  if (!stockSearch) return true;
                  const searchLower = stockSearch.toLowerCase();
                  return (
                    item.product?.name?.toLowerCase().includes(searchLower) ||
                    item.batch?.batchNumber?.toLowerCase().includes(searchLower)
                  );
                }).length > 0 ? (
                  inventoryStock
                    .filter((item) => {
                      if (!stockSearch) return true;
                      const searchLower = stockSearch.toLowerCase();
                      return (
                        item.product?.name?.toLowerCase().includes(searchLower) ||
                        item.batch?.batchNumber?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((item) => {
                      const prodId = item.product?._id || item.product;
                      const isExpiringSoon =
                        item.expiryDate &&
                        new Date(item.expiryDate) < new Date(Date.now() + 60 * 86400000);

                      // Check if any sales orders are waiting for this product
                      const waitingOrdersCount = salesOrders.filter((order) =>
                        (order.status === "production-required" || order.status === "partial") &&
                        order.items?.some(
                          (i) => (i.product?._id === prodId || i.product === prodId) && (i.remainingQuantity || 0) > 0
                        )
                      ).length;

                      return (
                        <tr key={item._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-semibold text-slate-200">
                            {item.product?.name || "Product"}
                            {item.product?.dosageForm && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {item.product.dosageForm} • {item.product.strength}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">
                            {item.batch?.batchNumber || "BATCH-DIRECT"}
                          </td>
                          <td className="p-3">
                            <span className={`font-mono font-bold text-sm ${
                              (item.quantity || 0) > 500
                                ? "text-emerald-400"
                                : (item.quantity || 0) > 0
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}>
                              {(item.quantity || 0).toLocaleString()} units
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[11px] ${isExpiringSoon ? "text-rose-400 font-bold" : "text-slate-300"}`}>
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            ₹{item.product?.price || 0} / unit
                          </td>
                          <td className="p-3">
                            {waitingOrdersCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                ⚠️ {waitingOrdersCount} Order(s) Awaiting Allocation
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">No pending demand</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {waitingOrdersCount > 0 && (item.quantity || 0) > 0 ? (
                              <button
                                onClick={() => handleAllocateProductToWaitingOrders(prodId, item.product?.name)}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-bold transition shadow flex items-center gap-1 ml-auto"
                              >
                                <Sparkles size={12} /> Allocate to Orders
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 3: REVENUE TRENDS & INVOICE ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Commercial Revenue Performance</h3>
            <p className="text-xs text-slate-400">Total Billed vs Settled Cash Receipts per client order</p>
          </div>

          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                  <Bar dataKey="revenue" fill="#10b981" name="Billed Order (₹)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="paid" fill="#3b82f6" name="Paid Collected (₹)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No revenue trends to display
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PREDICTIVE SALES & PRODUCT DEMAND FORECASTING */}
      {activeTab === "forecast" && (
        <div className="space-y-6">
          {/* Top Predictive Banner */}
          <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles size={16} /> Advanced AI & Statistical Demand Forecasting
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Next-Month Revenue Projection:{" "}
                <span className="text-emerald-400">
                  ₹{(forecastData?.predictedRevenue || 0).toLocaleString()}
                </span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Forecast for <span className="font-semibold text-white">{forecastData?.forecastMonth || "Next Month"}</span> • Projected Growth:{" "}
                <span className={forecastData?.projectedGrowthPercent >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {forecastData?.projectedGrowthPercent > 0 ? "+" : ""}{forecastData?.projectedGrowthPercent || 0}%
                </span>{" "}
                vs Last Month (₹{(forecastData?.lastMonthRevenue || 0).toLocaleString()})
              </p>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-2xl text-center">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Projected Velocity</p>
                <h4 className="text-xl font-bold text-indigo-400 mt-1">
                  {forecastData?.productForecasts?.reduce((s, p) => s + p.predictedDemandQuantity, 0).toLocaleString() || 0} Units
                </h4>
              </div>
            </div>
          </div>

          {/* Product-by-Product Demand & Factory Batch Recommendations */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Package size={18} className="text-indigo-400" />
              Predicted Product Demand & Factory Batch Allocation Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Machine-learning projections based on 90-day order momentum, seasonality, and clinical re-order frequencies.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-3">Product Formulation</th>
                    <th className="p-3">Avg Historical Price</th>
                    <th className="p-3">Current Warehouse Stock</th>
                    <th className="p-3">Projected Next-Month Demand</th>
                    <th className="p-3">Recommended Production Batch</th>
                    <th className="p-3">Est. Next-Month Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {forecastData?.productForecasts && forecastData.productForecasts.length > 0 ? (
                    forecastData.productForecasts.map((prod) => (
                      <tr key={prod.productId} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-bold text-white">{prod.productName}</p>
                          <p className="text-[10px] text-slate-400">ID: {prod.productId?.slice(-6)}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-300">
                          ₹{prod.averagePrice?.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold ${prod.currentInventoryStock < prod.predictedDemandQuantity ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {prod.currentInventoryStock.toLocaleString()} Units
                          </span>
                        </td>
                        <td className="p-3 font-bold text-indigo-400">
                          {prod.predictedDemandQuantity.toLocaleString()} Units
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-amber-400">
                            {prod.recommendedProductionUnits > 0 ? `+${prod.recommendedProductionUnits.toLocaleString()} Units` : "Stock Adequate"}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-400">
                          ₹{prod.predictedRevenue?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">
                        Insufficient sales transaction history to compute next-month forecast.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: SALES REPRESENTATIVES OPERATIONS */}
      {activeTab === "team" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leave Approvals */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-400" />
                Sales Rep Leave Approvals
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
                  No pending leave approval requests from sales staff.
                </div>
              )}
            </div>
          </div>

          {/* Sales Attendance Today */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 size={18} className="text-teal-400" />
                Sales Representatives Attendance Today
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
                        No sales staff attendance logged today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW COMMERCIAL SALES ORDER */}
      {createOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald-400" />
                Generate Commercial Sales Order
              </h3>
              <button onClick={() => setCreateOrderModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Register hospital procurement or wholesale pharmacy distributor order.
            </p>

            <form onSubmit={handleCreateOrder} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Customer / Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Hospital / Enterprise Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Hospitals Ltd"
                    value={orderForm.companyName}
                    onChange={(e) => setOrderForm({ ...orderForm, companyName: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="orders@client.com"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Select Drug Formulation</label>
                <select
                  value={orderForm.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  required
                >
                  <option value="">Choose Formulation</option>
                  {products.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} (₹{prod.price?.toFixed(2)}/unit)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={orderForm.discount}
                    onChange={(e) => setOrderForm({ ...orderForm, discount: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Initial Advance Payment (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={orderForm.paidAmount}
                  onChange={(e) => setOrderForm({ ...orderForm, paidAmount: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-400 outline-none font-mono font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOrderModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingAction ? "Processing..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COLLECT PAYMENT / RECEIPT */}
      {paymentModalOpen && selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={18} className="text-emerald-400" />
                Collect Payment Settlement
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Client: <span className="text-emerald-400 font-bold">{selectedOrderForPayment.customerName}</span>
            </p>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Settlement Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="cheque">Company Cheque</option>
                  <option value="upi">UPI / Instant Transfer</option>
                  <option value="cash">Cash / Counter Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  placeholder="e.g. UTR / NEFT Reference #5582910"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingAction ? "Recording..." : "Record Payment"}
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
          fetchSalesData();
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

export default SalesDashboard;