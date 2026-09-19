import { useEffect, useState } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const QCHistory = () => {

  const [qc, setQc] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQC = async () => {
    try {
      const res = await api.get("/qc");
      setQc(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch {
      toast.error("Failed to load QC data");
      setQc([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchQC();
  }, []);


  if (loading) {
    return (
      <div className="text-white p-6">
        Loading...
      </div>
    );
  }


  return (

    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">

      {/* Header */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          QC History
        </h1>

        <p className="text-gray-400">
          Quality Control Inspection Records
        </p>

      </div>


      {/* Table */}

      <div className="
      bg-white/5
      backdrop-blur-lg
      border border-white/10
      rounded-2xl
      shadow-xl
      overflow-x-auto
      ">

        <table className="w-full">

          <thead className="border-b border-white/10">

            <tr className="text-gray-400 text-sm">

              <th className="p-4 text-left">Batch</th>
              <th className="p-4 text-left">Result</th>
              <th className="p-4 text-left">Checked By</th>
              <th className="p-4 text-left">Remarks</th>
              <th className="p-4 text-left">Date</th>

            </tr>

          </thead>


          <tbody>

            {qc.map((item) => (

              <motion.tr
                key={item._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="
                border-b border-white/5
                hover:bg-white/5
                transition
                "
              >

                <td className="p-4">
                  {item.batch?.batchNumber || "N/A"}
                </td>

                <td className="p-4">

                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs
                    ${item.result === "pass"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"}
                    `}
                  >
                    {item.result}
                  </span>

                </td>

                <td className="p-4">
                  {item.checkedBy?.name}
                </td>

                <td className="p-4">
                  {item.remarks || "-"}
                </td>

                <td className="p-4 text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>

              </motion.tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default QCHistory;