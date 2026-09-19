import { useEffect, useState } from "react";
import api from "../../services/api";

const BatchDashboard = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchBatch();
  }, []);

  const fetchBatch = async () => {
    try {
      const res = await api.get("/batch");
      setData(Array.isArray(res.data) ? res.data : (res.data?.batches || res.data?.data || []));
    } catch {
      setData([]);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        Batch Dashboard
      </h1>

      <table className="w-full">

        <thead className="bg-slate-700">
          <tr>
            <th className="p-3">Batch</th>
            <th className="p-3">Product</th>
            <th className="p-3">Qty</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>

        <tbody>

          {data.map(batch => (

            <tr
              key={batch._id}
              className="border-t border-slate-700"
            >

              <td>{batch.batchNumber}</td>

              <td>
                {batch.product?.name}
              </td>

              <td>
                {batch.quantity}
              </td>

              <td>
                {batch.status}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
};

export default BatchDashboard;