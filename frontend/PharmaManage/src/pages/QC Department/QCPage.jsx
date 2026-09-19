import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const QCPage = () => {
  const [batches, setBatches] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/batch/getBatch");
      const list = Array.isArray(data) ? data : (data?.data || data?.batches || []);
      const pending = list.filter((b) => b.status === "pending");
      setBatches(pending);

    } catch (err) {
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleQC = async (batchId, result) => {
    try {
      setProcessing(batchId);

      await api.post("/qc/check", {
        batchId,
        result,
        remarks: remarks[batchId] || ""
      });

      toast.success(`QC ${result} success ✅`);

      fetchBatches();

    } catch (err) {
      toast.error(err.response?.data?.message || "QC failed");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-white">
        Loading QC Batches...
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        QC Dashboard
      </h1>

      {batches.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No pending batches
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">

        {batches.map((batch) => (

          <div
            key={batch._id}
            className="bg-slate-800 p-5 rounded-xl shadow"
          >

            <div className="flex justify-between mb-2">

              <h2 className="font-semibold text-lg">
                {batch.product?.name}
              </h2>

              <span className="bg-yellow-600 text-sm px-2 py-1 rounded">
                Pending
              </span>

            </div>

            <p className="text-sm text-gray-300">
              Batch: {batch.batchNumber}
            </p>

            <p className="text-sm text-gray-300">
              Qty: {batch.quantity}
            </p>

            <p className="text-sm text-gray-300">
              Exp: {new Date(batch.expiryDate).toLocaleDateString()}
            </p>

            {/* Remarks */}

            <textarea
              placeholder="Enter remarks..."
              className="w-full mt-3 p-2 bg-slate-700 rounded"
              onChange={(e) =>
                setRemarks({
                  ...remarks,
                  [batch._id]: e.target.value
                })
              }
            />

            {/* Buttons */}

            <div className="flex gap-2 mt-4">

              <button
                disabled={processing === batch._id}
                onClick={() => handleQC(batch._id, "pass")}
                className="flex-1 bg-green-600 py-2 rounded hover:bg-green-700"
              >
                {processing === batch._id ? "Processing..." : "✅ Pass"}
              </button>

              <button
                disabled={processing === batch._id}
                onClick={() => handleQC(batch._id, "fail")}
                className="flex-1 bg-red-600 py-2 rounded hover:bg-red-700"
              >
                {processing === batch._id ? "Processing..." : "❌ Fail"}
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default QCPage;