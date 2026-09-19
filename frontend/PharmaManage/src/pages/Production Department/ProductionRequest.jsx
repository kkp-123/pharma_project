import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Factory, Clock, CheckCircle2 } from "lucide-react";

const ProductionRequest = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/production-demand");
      setData(res.data?.demands || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Error fetching demands:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
          <Factory size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Production Schedules & Demands</h1>
          <p className="text-xs text-slate-400">Incoming demand orders requiring production synthesis</p>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="p-3.5">Product Formulation</th>
              <th className="p-3.5">Required Quantity</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Assigned To</th>
              <th className="p-3.5">Schedule Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/60">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  Loading production requests...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item) => (
                <tr key={item._id} className="hover:bg-slate-700/40 transition">
                  <td className="p-3.5 font-semibold text-slate-200">
                    {item.product?.name || "Product"}
                  </td>
                  <td className="p-3.5 font-mono text-amber-300 font-bold">
                    {(item.quantity || item.requiredQuantity || 0).toLocaleString()} units
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : item.status === "in-production"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300">
                    {item.assignedTo?.name || "Unassigned"}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {new Date(item.startDate || item.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  No production demands found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionRequest;