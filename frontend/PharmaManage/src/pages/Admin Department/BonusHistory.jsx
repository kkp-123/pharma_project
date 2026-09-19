import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Gift } from "lucide-react";

const BonusHistory = () => {

  const [bonus, setBonus] = useState([]);
  const [month, setMonth] = useState("");

  useEffect(() => {
    fetchBonus();
  }, [month]);

  const fetchBonus = async () => {

    try {
      const { data } = await api.get(`/bonus?month=${month}`);
      setBonus(data?.bonus || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.log(error);
      setBonus([]);
    }

  };


  const markPaid = async (id) => {

    try {

      await api.put(`/bonus/${id}/pay`);

      toast.success("Marked Paid");

      fetchBonus();

    } catch (error) {

      toast.error("Error");

    }

  };


  return (

    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6 flex gap-2">
        <Gift /> Bonus History
      </h1>


      {/* Filter */}

      <div className="mb-6">

        <input
          type="month"
          className="bg-slate-800 p-2 rounded"
          onChange={(e) =>
            setMonth(e.target.value)
          }
        />

      </div>


      {/* Table */}

      <div className="bg-slate-800 rounded-xl p-4 overflow-auto">

        <table className="w-full">

          <thead>

            <tr className="text-left text-gray-400">

              <th>Employee</th>
              <th>Department</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {bonus.map(b => (

              <tr
                key={b._id}
                className="border-t border-slate-700"
              >

                <td>
                  {b.employee?.name}
                </td>

                <td>
                  {b.employee?.department}
                </td>

                <td>
                  {b.month}
                </td>

                <td>
                  ₹ {b.amount}
                </td>

                <td>

                  {b.isPaid ? (

                    <span className="text-green-400">
                      Paid
                    </span>

                  ) : (

                    <span className="text-yellow-400">
                      Pending
                    </span>

                  )}

                </td>

                <td>

                  {!b.isPaid && (

                    <button
                      onClick={() =>
                        markPaid(b._id)
                      }
                      className="
                      bg-emerald-500 
                      px-3 
                      py-1 
                      rounded
                      "
                    >

                      Mark Paid

                    </button>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default BonusHistory;