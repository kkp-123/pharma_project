import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import downloadReceipt from "../../utils/downloadReciept";

import {
  DollarSign,
  User,
  Package,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Factory,
  Trash2
} from "lucide-react";

const SalesOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);

  const [payment, setPayment] = useState({
    amount: "",
    method: "cash",
    note: ""
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "approved":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "partial":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "production-required":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/sales/${id}`);
      setSale(data?.sale || data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Allocate Available Inventory Stock
  const handleAllocateStock = async () => {
    try {
      setAllocating(true);
      const res = await api.post(`/sales/${id}/allocate`, { createDemandIfEmpty: true });
      toast.success(res.data?.message || "Stock allocation completed!");
      fetchSale();
    } catch (error) {
      toast.error(error.response?.data?.message || "Allocation failed");
    } finally {
      setAllocating(false);
    }
  };

  // Add Payment
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const addPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!payment.amount || Number(payment.amount) <= 0) {
      return toast.error("Please enter a valid payment amount");
    }

    try {
      setSubmittingPayment(true);
      const res = await api.post(`/sales/${id}/payment`, {
        amount: Number(payment.amount),
        method: payment.method,
        note: payment.note
      });
      toast.success(res.data?.message || "Payment Added Successfully");
      setPayment({
        amount: "",
        method: "cash",
        note: ""
      });
      fetchSale();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding payment");
    } finally {
      setSubmittingPayment(false);
    }
  };
  const handlePayment = addPayment;

  // Change Status
  const updateStatus = async (status) => {
    try {
      await api.put(`/sales/${id}`, { status });
      toast.success("Status Updated");
      fetchSale();
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  // Delete Order
  const handleDeleteSale = async () => {
    if (!window.confirm("Are you sure you want to delete this commercial sales order? Any allocated inventory will be released back to warehouse stock.")) {
      return;
    }

    try {
      const res = await api.delete(`/sales/${id}`);
      toast.success(res.data?.message || "Sales order deleted successfully");
      navigate("/sales/orders");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete sales order");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-emerald-400" size={24} />
          <span>Loading Sales Order details...</span>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-6 text-white min-h-screen bg-slate-900 text-center">
        <h2 className="text-xl font-bold text-rose-400">Order not found</h2>
      </div>
    );
  }

  const hasRemainingStock = sale.items?.some((i) => (i.remainingQuantity || 0) > 0);

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Package size={14} /> Commercial Order #{sale._id?.slice(-6).toUpperCase()}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {sale.customerName}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            {sale.companyName ? `${sale.companyName} • ` : ""}
            Created on {new Date(sale.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {hasRemainingStock && (
            <button
              onClick={handleAllocateStock}
              disabled={allocating}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition disabled:opacity-50"
            >
              <Sparkles size={15} />
              {allocating ? "Checking Stock..." : "⚡ Allocate Available Stock"}
            </button>
          )}

          <button
            onClick={() => downloadReceipt(sale)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            Download Invoice PDF
          </button>

          <button
            onClick={handleDeleteSale}
            className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Trash2 size={15} /> Delete Order
          </button>
        </div>
      </div>

      {/* Production & Stock Status Banner */}
      {sale.status === "production-required" && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
          <Factory size={20} className="text-rose-400 shrink-0" />
          <div>
            <span className="font-bold block text-rose-200">Out of Stock — Production Demand Generated</span>
            This order required more units than current warehouse inventory. Production demand schedules have been sent to the manufacturing plant. Once batches pass QC, stock will be automatically allocated to this customer.
          </div>
        </div>
      )}

      {sale.status === "partial" && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
          <Clock size={20} className="text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block text-amber-200">Partially Allocated Order</span>
            Available warehouse stock has been allocated from active batches. The remaining unfulfilled units are scheduled with Production and awaiting laboratory QC release.
          </div>
        </div>
      )}

      {sale.status === "approved" && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold block text-emerald-200">100% Stock Allocated from Inventory</span>
            All requested pharmaceutical products have been fully allocated from unexpired warehouse batches and are ready for logistics dispatch.
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-semibold mb-1">Total Billed</p>
          <h3 className="text-2xl font-bold font-mono text-white">₹{(sale.totalAmount || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-semibold mb-1">Paid Collected</p>
          <h3 className="text-2xl font-bold font-mono text-emerald-400">₹{(sale.paidAmount || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-semibold mb-1">Balance Due</p>
          <h3 className="text-2xl font-bold font-mono text-rose-400">₹{(sale.dueAmount || 0).toLocaleString()}</h3>
        </div>

        <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-md">
          <p className="text-xs text-slate-400 font-semibold mb-1">Fulfillment Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(sale.status)}`}>
            {sale.status}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
        <h2 className="font-bold text-sm text-slate-300 flex items-center gap-2">
          <User size={16} className="text-indigo-400" /> Commercial Client Details
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Customer Name</p>
            <p className="font-bold text-white mt-0.5">{sale.customerName}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Organization / Hospital</p>
            <p className="font-bold text-white mt-0.5">{sale.companyName || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Contact Email</p>
            <p className="font-bold text-white mt-0.5">{sale.email || "-"}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Phone</p>
            <p className="font-bold text-white mt-0.5">{sale.phone || "-"}</p>
          </div>
          {sale.address && (
            <div className="sm:col-span-2 lg:col-span-4 border-t border-slate-700/60 pt-2">
              <p className="text-slate-400 font-medium">Delivery Address</p>
              <p className="text-slate-200 mt-0.5">{sale.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Products & Batch Allocations Table */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
        <h2 className="font-bold text-sm text-slate-300 flex items-center gap-2">
          <Layers size={16} className="text-emerald-400" /> Products & Inventory Batch Allocations
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-3">Product Formulation</th>
                <th className="p-3">Ordered Qty</th>
                <th className="p-3">Allocated (From Stock)</th>
                <th className="p-3">Pending (Demand Created)</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">Item Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {sale.items?.map((item, i) => (
                <tr key={i} className="hover:bg-slate-700/30 transition">
                  <td className="p-3 font-semibold text-slate-200">
                    {item.product?.name || "Product"}
                  </td>
                  <td className="p-3 font-mono font-bold text-white">
                    {item.quantity?.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {item.allocatedQuantity || 0} units
                  </td>
                  <td className="p-3 font-mono font-bold">
                    {(item.remainingQuantity || 0) > 0 ? (
                      <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {item.remainingQuantity} units (In Demand)
                      </span>
                    ) : (
                      <span className="text-emerald-400">0 (Fully Fulfilled)</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    ₹{item.price?.toFixed(2)}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    ₹{(item.total || item.quantity * item.price)?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Batch Allocation Breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
            Allocated Active Batches Breakdown:
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sale.items?.map((item, i) =>
              item.batchAllocations && item.batchAllocations.length > 0 ? (
                item.batchAllocations.map((b, bIdx) => (
                  <div
                    key={`${i}-${bIdx}`}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="text-emerald-400 font-bold font-mono">
                        {b.batch?.batchNumber || (typeof b.batch === "string" ? b.batch : "Batch Ref")}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.product?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {b.quantity} units
                      </span>
                    </div>
                  </div>
                ))
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Section */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
        <h2 className="font-bold text-sm text-slate-300 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-400" /> Record Client Payment Settlement
        </h2>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              className="w-full p-2.5 bg-slate-700/80 rounded-xl text-xs text-emerald-400 font-mono font-bold outline-none border border-slate-600 focus:border-emerald-500"
              value={payment.amount}
              onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
            <select
              className="w-full p-2.5 bg-slate-700/80 rounded-xl text-xs text-white outline-none border border-slate-600"
              value={payment.method}
              onChange={(e) => setPayment({ ...payment, method: e.target.value })}
            >
              <option value="cash">Cash / Counter</option>
              <option value="bank">Bank Transfer (NEFT / RTGS)</option>
              <option value="upi">UPI / Online</option>
              <option value="cheque">Company Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Transaction Ref / Note</label>
            <input
              placeholder="e.g. UTR #4492019"
              className="w-full p-2.5 bg-slate-700/80 rounded-xl text-xs text-white outline-none border border-slate-600"
              value={payment.note}
              onChange={(e) => setPayment({ ...payment, note: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={addPayment}
          disabled={submittingPayment}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5"
        >
          <DollarSign size={14} /> {submittingPayment ? "Recording..." : "Add Payment Entry"}
        </button>
      </div>

      {/* Payment History */}
      {sale.payments && sale.payments.length > 0 && (
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
          <h2 className="font-bold text-sm text-slate-300">Payment Transaction Log</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Reference / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {sale.payments.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 text-slate-400">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">₹{p.amount?.toLocaleString()}</td>
                    <td className="p-3 uppercase font-semibold text-slate-300">{p.method}</td>
                    <td className="p-3 text-slate-400">{p.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Status Override */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-3">
        <h2 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
          Manual Order Status Override
        </h2>

        <div className="flex gap-2 flex-wrap">
          {["pending", "approved", "partial", "production-required", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${
                sale.status === s
                  ? "bg-indigo-600 text-white border-indigo-500 shadow"
                  : "bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetails;