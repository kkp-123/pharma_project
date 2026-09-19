import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const SalesPayments = () => {

    const [sales, setSales] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [month, setMonth] = useState("");

    const [selectedSale, setSelectedSale] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        method: "cash",
        note: ""
    });


    // FETCH SALES
    const fetchSales = async () => {
        try {
            const res = await api.get("/sales");
            setSales(res.data?.sales || (Array.isArray(res.data) ? res.data : []));
        } catch {
            toast.error("Failed to load sales");
            setSales([]);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);


    // FILTER LOGIC
    const filtered = sales.filter((s) => {

        const statusMatch =
            filter === "ALL" || s.paymentStatus === filter;

        const monthMatch =
            !month ||
            (s.createdAt && !isNaN(new Date(s.createdAt)) ? new Date(s.createdAt).toISOString().slice(0, 7) === month : false);

        return statusMatch && monthMatch;
    });


    // ADD PAYMENT
    const addPayment = async () => {
        try {

            await api.post(
                `/sales/${selectedSale._id}/payment`,
                paymentForm
            );

            toast.success("Payment added");

            setSelectedSale(null);
            setPaymentForm({ amount: "", method: "cash", note: "" });

            fetchSales();

        } catch {
            toast.error("Payment failed");
        }
    };


    return (
        <div className="p-6 bg-gray-900 min-h-screen text-gray-100">

            {/* HEADER */}
            <h1 className="text-2xl font-bold mb-4 text-white">
                💰 Sales Payment Dashboard
            </h1>


            {/* FILTERS */}
            <div className="flex gap-3 mb-6">

                <select
                    className="p-2 border border-gray-700 rounded bg-gray-800 text-white"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="ALL">All</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                </select>

                <input
                    type="month"
                    className="p-2 border border-gray-700 rounded bg-gray-800 text-white"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                />

            </div>


            {/* CARDS */}
            <div className="grid md:grid-cols-3 gap-4">

                {filtered.map((sale) => (

                    <div
                        key={sale._id}
                        className="bg-gray-800 border border-gray-700 shadow-lg rounded-xl p-4 hover:shadow-xl transition"
                    >

                        <h2 className="font-bold text-lg text-white">
                            {sale.customerName}
                        </h2>

                        <p className="text-sm text-gray-400">
                            {sale.companyName}
                        </p>

                        <div className="mt-3 text-sm text-gray-300">
                            Total: ₹{sale.totalAmount}
                        </div>

                        <div className="text-sm text-green-400">
                            Paid: ₹{sale.paidAmount}
                        </div>

                        <div className="text-sm text-red-400">
                            Due: ₹{sale.dueAmount}
                        </div>


                        {/* STATUS BADGE */}
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded font-medium
              ${sale.paymentStatus === "paid"
                                ? "bg-green-900 text-green-400"
                                : sale.paymentStatus === "partial"
                                    ? "bg-yellow-900 text-yellow-400"
                                    : "bg-red-900 text-red-400"
                            }`}>
                            {sale.paymentStatus}
                        </span>


                        {/* ACTION */}
                        <button
                            disabled={sale.paymentStatus === "paid"}
                            onClick={() => setSelectedSale(sale)}
                            className={`mt-4 w-full py-2 rounded-lg transition
    ${sale.paymentStatus === "paid"
                                    ? "bg-gray-600 cursor-not-allowed text-gray-400"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                        >
                            {sale.paymentStatus === "paid"
                                ? "Fully Paid"
                                : "Add Payment"}
                        </button>

                    </div>

                ))}

            </div>


            {/* PAYMENT MODAL */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center">

                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl w-96">

                        <h2 className="text-lg font-bold mb-3 text-white">
                            Add Payment
                        </h2>

                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-full mb-2 p-2 border border-gray-700 rounded bg-gray-900 text-white"
                            value={paymentForm.amount}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    amount: e.target.value
                                })
                            }
                        />

                        <select
                            className="w-full mb-2 p-2 border border-gray-700 rounded bg-gray-900 text-white"
                            value={paymentForm.method}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    method: e.target.value
                                })
                            }
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank">Bank</option>
                        </select>

                        <input
                            placeholder="Note"
                            className="w-full mb-2 p-2 border border-gray-700 rounded bg-gray-900 text-white"
                            value={paymentForm.note}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    note: e.target.value
                                })
                            }
                        />


                        <div className="flex gap-2 mt-3">

                            <button
                                onClick={() => setSelectedSale(null)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={addPayment}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                            >
                                Save
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default SalesPayments;