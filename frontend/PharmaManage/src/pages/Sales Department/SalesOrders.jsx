import { useEffect, useState } from "react";
import api from "../../services/api";
import { Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SalesOrders = () => {

  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data } = await api.get("/sales");
      setSales(data?.sales || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.log(error);
      setSales([]);
    }
  };

  const handleDeleteSale = async (e, saleId, customerName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete order for "${customerName}"? Any allocated inventory will be released back to warehouse stock.`)) {
      return;
    }

    try {
      const res = await api.delete(`/sales/${saleId}`);
      toast.success(res.data?.message || "Sales order deleted successfully");
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete sales order");
    }
  };

  // Filter + Search

  const filteredSales = sales.filter((sale) => {

    const matchesFilter =
      filter === "all" || sale.status === filter;

    const matchesSearch =
      sale.customerName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      sale.companyName
        ?.toLowerCase()
        .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;

  });

  const getStatusColor = (status) => {

    switch (status) {
      case "approved":
        return "bg-green-500";

      case "pending":
        return "bg-yellow-500";

      case "partial":
        return "bg-orange-500";

      case "production-required":
        return "bg-red-500";

      case "completed":
        return "bg-blue-500";

      default:
        return "bg-gray-500";
    }

  };

  return (

    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        Sales Orders
      </h1>


      {/* Search + Filter */}

      <div className="flex flex-col md:flex-row gap-4 mb-6">

        {/* Search */}

        <div className="flex items-center bg-slate-800 px-3 py-2 rounded-lg w-full">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search customer..."
            className="bg-transparent outline-none ml-2 w-full"
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        {/* Filters */}

        <div className="flex gap-2 flex-wrap">

          {[
            "all",
            "pending",
            "approved",
            "partial",
            "production-required",
            "completed"
          ].map((f) => (

            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                filter === f
                  ? "bg-blue-500"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {f}
            </button>

          ))}

        </div>

      </div>


      {/* Sales Cards */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {filteredSales.map((sale) => (

          <div
            key={sale._id}
            onClick={() => navigate(`/dashboard/sales/${sale._id}`)}
            className="bg-slate-800 p-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition cursor-pointer"
          >

            {/* Header */}

            <div className="flex justify-between mb-3">

              <h2 className="font-semibold text-lg">
                {sale.customerName}
              </h2>

              <span
                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                  sale.status
                )}`}
              >
                {sale.status}
              </span>

            </div>


            {/* Company */}

            <p className="text-sm text-slate-400">
              {sale.companyName || "No company"}
            </p>


            {/* Products */}

            <div className="mt-3 space-y-1">

              {sale.items?.map((item, i) => (

                <div
                  key={i}
                  className="flex justify-between text-sm"
                >

                  <span>
                    {item.product?.name}
                  </span>

                  <span>
                    {item.quantity}
                  </span>

                </div>

              ))}

            </div>


            {/* Footer */}

            <div className="mt-4 border-t border-slate-700 pt-3 flex justify-between items-center">

              <div>
                <p className="text-xs text-slate-400">
                  Total
                </p>

                <p className="font-bold text-emerald-400">
                  ₹ {sale.totalAmount}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    Date
                  </p>

                  <p className="text-sm">
                    {new Date(
                      sale.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  title="Delete Order"
                  onClick={(e) => handleDeleteSale(e, sale._id, sale.customerName)}
                  className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>

            </div>

          </div>

        ))}

      </div>


      {/* No Data */}

      {filteredSales.length === 0 && (

        <div className="text-center mt-10 text-slate-400">
          No sales found
        </div>

      )}

    </div>

  );

};

export default SalesOrders;