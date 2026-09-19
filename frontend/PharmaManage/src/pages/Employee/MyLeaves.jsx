import { useEffect, useState } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const leaveRes = await api.get("/leave/my");
      setLeaves(leaveRes.data?.leaves || (Array.isArray(leaveRes.data) ? leaveRes.data : []));
    } catch (error) {
      toast.error("Failed to load leaves");
      setLeaves([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-white min-h-screen bg-slate-950">
        Loading leaves...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          My Leave History
        </h1>
        <p className="text-gray-400">
          View your leave requests and status
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <StatCard
          title="Total Leaves"
          value={leaves.length}
          icon={<Calendar />}
        />

        <StatCard
          title="Approved"
          value={leaves.filter(l => l.status === "approved").length}
          icon={<CheckCircle />}
        />

        <StatCard
          title="Pending"
          value={leaves.filter(l => l.status === "pending").length}
          icon={<Clock />}
        />

      </div>

      {/* Table */}

      <div className="
      bg-white/5 
      backdrop-blur-xl 
      border border-white/10 
      rounded-2xl 
      shadow-lg 
      overflow-x-auto
      ">

        <table className="w-full text-sm">

          <thead className="border-b border-white/10 text-gray-400">
            <tr>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">From</th>
              <th className="p-4 text-left">To</th>
              <th className="p-4 text-left">Days</th>
              <th className="p-4 text-left">Reason</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>

            {leaves.map((leave) => (

              <motion.tr
                key={leave._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="
                border-b border-white/5
                hover:bg-white/5
                transition
                "
              >

                <td className="p-4">
                  {leave.type || "Leave"}
                </td>

                <td className="p-4">
                  {formatDate(leave.startDate)}
                </td>

                <td className="p-4">
                  {formatDate(leave.endDate)}
                </td>

                <td className="p-4">
                  {   (new Date(leave.endDate) - new Date(leave.startDate)) /
        (1000 * 60 * 60 * 24) +
        1}
                </td>

                <td className="p-4">
                  {leave.reason || "-"}
                </td>

                <td className="p-4">
                  <StatusBadge status={leave.status} />
                </td>

              </motion.tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default MyLeaves;



// Status Badge

const StatusBadge = ({ status }) => {

  const styles = {
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
    pending: "bg-yellow-500/20 text-yellow-400"
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs ${styles[status]}`}
    >
      {status}
    </span>
  );
};


// Stat Card

const StatCard = ({ title, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="
    bg-white/5 
    border border-white/10 
    p-5 
    rounded-2xl 
    shadow
    flex justify-between items-center
    "
  >
    <div>
      <p className="text-gray-400 text-sm">
        {title}
      </p>
      <h3 className="text-2xl font-bold">
        {value}
      </h3>
    </div>

    <div className="text-indigo-400">
      {icon}
    </div>

  </motion.div>
);


// Format Date

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};