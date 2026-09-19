import { useEffect, useState } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("all");

  // Fetch Leaves
 const fetchLeaves = async () => {
  try {
    const res = await api.get("/leave/manager");

    console.log(res.data); // DEBUG

    setLeaves(res.data.leaves || []);
    console.log(leaves);
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    fetchLeaves();
  }, []);

  //Update Status
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/leave/${id}`, { status });

      setLeaves(prev =>
        prev.map(l =>
          l._id === id ? { ...l, status }: l
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Logic
  const filteredLeaves =
    filter === "all"
      ? leaves
      : leaves.filter(l => l.status === filter);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200">

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6">
         Manage Leave Requests
      </h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-lg text-sm ${
              filter === f
                ? "bg-indigo-600"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredLeaves.length === 0 ? (
          <p className="text-slate-400 text-center">
            No leave requests
          </p>
        ) : (
          filteredLeaves.map((leave) => (
            <motion.div
              key={leave._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 p-5 rounded-2xl shadow flex justify-between items-center"
            >
              {/* Left Info */}
              <div>
                <p className="font-semibold text-lg">
                  {leave.employee?.name}
                </p>

                <p className="text-sm text-indigo-400">
                  {leave.type.toUpperCase()} Leave
                </p>

                <p className="text-sm text-slate-400">
                  {leave.reason}
                </p>

                <p className="text-xs text-slate-500">
                  {new Date(leave.startDate).toDateString()} →{" "}
                  {new Date(leave.endDate).toDateString()}
                </p>
              </div>

              {/* Right Actions */}
              <div className="flex flex-col items-end gap-2">

                {/* Status Badge */}
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    leave.status === "approved"
                      ? "bg-green-600"
                      : leave.status === "rejected"
                      ? "bg-red-600"
                      : "bg-yellow-500 text-black"
                  }`}
                >
                  {leave.status.toUpperCase()}
                </span>

                {/* Buttons */}
                {leave.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateStatus(leave._id, "approved")
                      }
                      className="bg-green-500 px-3 py-1 rounded hover:bg-green-600 transition"
                    >
                      ✔ Approve
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(leave._id, "rejected")
                      }
                      className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      ✖ Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerLeaves;