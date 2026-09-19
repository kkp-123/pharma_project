import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Search, AlertCircle, X, Factory, CheckCircle2 } from "lucide-react";

const ProductionDemand = () => {
    const [demands, setDemands] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Create Demand Modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [demandForm, setDemandForm] = useState({
        product: "",
        quantity: 5000,
        companyName: "Internal Warehouse"
    });
    const [submittingDemand, setSubmittingDemand] = useState(false);

    // Duplicate Demand Confirmation Popup
    const [duplicateConfirmModal, setDuplicateConfirmModal] = useState({
        open: false,
        message: "",
        product: "",
        quantity: 5000,
        companyName: ""
    });

    useEffect(() => {
        fetchDemands();
        fetchEmployees();
        fetchProducts();
    }, []);

    const fetchDemands = async () => {
        try {
            setLoading(true);
            const res = await api.get("/production-demand");
            setDemands(res.data?.demands || (Array.isArray(res.data) ? res.data : []));
        } catch (error) {
            toast.error("Failed to load demands");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/users");
            const userList = res.data?.users || (Array.isArray(res.data) ? res.data : []);
            const productionEmployees = userList.filter(
                (user) => user.department === "Production" && user.role === "employee"
            );
            setEmployees(productionEmployees);
        } catch (error) {
            setEmployees([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products/all").catch(() => api.get("/products"));
            setProducts(res.data?.products || (Array.isArray(res.data) ? res.data : []));
        } catch (error) {
            setProducts([]);
        }
    };

    // Create New Demand
    const handleCreateDemand = async (e, force = false) => {
        if (e && e.preventDefault) e.preventDefault();
        const prodId = force ? duplicateConfirmModal.product : demandForm.product;
        const qty = force ? duplicateConfirmModal.quantity : demandForm.quantity;
        const comp = force ? duplicateConfirmModal.companyName : demandForm.companyName;

        if (!prodId || !qty || Number(qty) <= 0) {
            return toast.error("Please select a valid product formulation and quantity");
        }

        try {
            setSubmittingDemand(true);
            const res = await api.post("/production-demand", {
                product: prodId,
                quantity: Number(qty),
                companyName: comp || "Internal Warehouse",
                force
            });

            if (res.data?.requiresConfirmation) {
                setCreateModalOpen(false);
                setDuplicateConfirmModal({
                    open: true,
                    message: res.data.message,
                    product: prodId,
                    quantity: qty,
                    companyName: comp
                });
                return;
            }

            toast.success(res.data?.message || "Production Demand created successfully!");
            setCreateModalOpen(false);
            setDuplicateConfirmModal({ open: false, message: "", product: "", quantity: 5000, companyName: "" });
            setDemandForm({ product: "", quantity: 5000, companyName: "Internal Warehouse" });
            fetchDemands();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create production demand");
        } finally {
            setSubmittingDemand(false);
        }
    };

    // Assign Employee
    const assignEmployee = async (id, employeeId) => {
        if (!employeeId || actionLoadingId) return;

        try {
            setActionLoadingId(id);
            await api.put(`/production-demand/assign/${id}`, { employeeId });
            toast.success("Assigned successfully");
            fetchDemands();
        } catch (error) {
            toast.error("Assignment failed");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Start Production
    const startProduction = async (id) => {
        if (actionLoadingId) return;

        try {
            setActionLoadingId(id);
            await api.put(`/production-demand/start/${id}`);
            toast.success("Production Started");
            fetchDemands();
        } catch (error) {
            toast.error("Failed to start");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Complete Production
    const completeProduction = async (id) => {
        if (actionLoadingId) return;

        try {
            setActionLoadingId(id);
            const res = await api.put(`/production-demand/complete/${id}`);
            toast.success(res.data?.message || "Production synthesis completed! Batch dispatched to QC.");
            fetchDemands();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete production");
        } finally {
            setActionLoadingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
            case "assigned":
                return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
            case "in-production":
                return "bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse";
            case "completed":
                return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
            default:
                return "bg-slate-700 text-slate-300";
        }
    };

    const filteredDemands = demands.filter((d) => {
        const matchesSearch =
            !searchTerm ||
            d.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 bg-slate-950 min-h-screen text-white space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Factory className="text-blue-500" />
                        Industrial Production Demands & Schedules
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Track manufacturing orders per client company, assign technicians, and release completed floor batches directly to QC inspection.
                    </p>
                </div>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2"
                >
                    <Plus size={16} /> Create Product Demand
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                    <input
                        type="text"
                        placeholder="Search product formulation or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {["ALL", "pending", "assigned", "in-production", "completed"].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                                statusFilter === st
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Demands Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl p-6"
            >
                {loading ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading manufacturing floor demands...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="p-3">Product Formulation</th>
                                    <th className="p-3">Target Client / Company</th>
                                    <th className="p-3">Batch Size (Units)</th>
                                    <th className="p-3">Floor Technician</th>
                                    <th className="p-3">Lifecycle Status</th>
                                    <th className="p-3 text-right">Floor Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredDemands.length > 0 ? (
                                    filteredDemands.map((d) => (
                                        <tr key={d._id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-3 font-semibold text-slate-200">
                                                {d.product?.name || "Product Formulation"}
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                                                    {d.companyName || "Internal Warehouse"}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono font-bold text-blue-400">
                                                {(d.quantity || 0).toLocaleString()} units
                                            </td>
                                            <td className="p-3">
                                                {d.assignedTo?.name ? (
                                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                                        <CheckCircle2 size={13} /> {d.assignedTo.name}
                                                    </span>
                                                ) : (
                                                    <select
                                                        disabled={actionLoadingId === d._id}
                                                        onChange={(e) => assignEmployee(d._id, e.target.value)}
                                                        className="bg-slate-800 border border-slate-700 text-slate-300 p-1.5 rounded-lg text-xs outline-none"
                                                    >
                                                        <option value="">Assign Technician</option>
                                                        {employees.map((emp) => (
                                                            <option key={emp._id} value={emp._id}>
                                                                {emp.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(d.status)}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                {d.status === "assigned" && (
                                                    <button
                                                        disabled={actionLoadingId === d._id}
                                                        onClick={() => startProduction(d._id)}
                                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white shadow"
                                                    >
                                                        {actionLoadingId === d._id ? "Starting..." : "Start Synthesis"}
                                                    </button>
                                                )}

                                                {d.status === "in-production" && (
                                                    <button
                                                        disabled={actionLoadingId === d._id}
                                                        onClick={() => completeProduction(d._id)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white shadow"
                                                    >
                                                        {actionLoadingId === d._id ? "Dispatching..." : "Complete & Send to QC"}
                                                    </button>
                                                )}

                                                {d.status === "completed" && (
                                                    <span className="text-slate-500 text-[11px] italic">
                                                        Batch Dispatched to QC
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-500">
                                            No production demands found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* CREATE DEMAND MODAL */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-bold flex items-center gap-2">
                                <Factory size={18} className="text-blue-400" />
                                Launch Production Demand
                            </h3>
                            <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">
                            Create a manufacturing schedule request for a formulation and client hospital/distributor.
                        </p>

                        <form onSubmit={(e) => handleCreateDemand(e, false)} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-300 mb-1 font-semibold">
                                    Product Formulation
                                </label>
                                <select
                                    required
                                    value={demandForm.product}
                                    onChange={(e) => setDemandForm({ ...demandForm, product: e.target.value })}
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                                >
                                    <option value="">Select Formulation</option>
                                    {products.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} {p.strength ? `(${p.strength})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1 font-semibold">
                                    Target Company / Hospital / Client Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Apollo Hospitals, Fortis Healthcare, Internal Warehouse"
                                    value={demandForm.companyName}
                                    onChange={(e) => setDemandForm({ ...demandForm, companyName: e.target.value })}
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                                    required
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {["Apollo Hospitals", "Fortis Healthcare", "Max Healthcare", "Internal Warehouse"].map((comp) => (
                                        <button
                                            type="button"
                                            key={comp}
                                            onClick={() => setDemandForm({ ...demandForm, companyName: comp })}
                                            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                                        >
                                            + {comp}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1 font-semibold">
                                    Required Batch Quantity (Units)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={demandForm.quantity}
                                    onChange={(e) => setDemandForm({ ...demandForm, quantity: e.target.value })}
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingDemand}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition"
                                >
                                    {submittingDemand ? "Creating..." : "Launch Demand"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DUPLICATE DEMAND CONFIRMATION POPUP */}
            {duplicateConfirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    Active Demand Exists for this Company
                                </h3>
                                <p className="text-xs text-amber-300 font-medium mt-0.5">
                                    Duplicate Prevention Notice
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
                            <p>{duplicateConfirmModal.message}</p>
                            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                                <span>Requested Batch Size:</span>
                                <span className="font-mono text-emerald-400 font-bold">
                                    {Number(duplicateConfirmModal.quantity).toLocaleString()} units
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setDuplicateConfirmModal({ open: false, message: "", product: "", quantity: 5000, companyName: "" })
                                }
                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                            >
                                Cancel / Keep Existing
                            </button>
                            <button
                                type="button"
                                disabled={submittingDemand}
                                onClick={() => handleCreateDemand(null, true)}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition"
                            >
                                {submittingDemand ? "Processing..." : "Create Another Demand"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionDemand;