import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Gift, Users, User } from "lucide-react";

const AddBonus = () => {

  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    employeeId: "",
    amount: "",
    month: "",
    reason: "",
    isForAll: false
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {

      const { data } = await api.get("/users");
      setEmployees(data?.users || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.log(error);
      setEmployees([]);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await api.post("/bonus", form);

      toast.success("Bonus Added");

      setForm({
        employeeId: "",
        amount: "",
        month: "",
        reason: "",
        isForAll: false
      });

    } catch (error) {

      toast.error("Error adding bonus");

    }

  };

  return (

    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6 flex gap-2 items-center">
        <Gift /> Add Bonus
      </h1>


      <div className="bg-slate-800 p-6 rounded-xl max-w-2xl">

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* For All */}

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              checked={form.isForAll}
              onChange={(e) =>
                setForm({
                  ...form,
                  isForAll: e.target.checked
                })
              }
            />

            <Users size={18} />

            Give Bonus To All Employees

          </label>


          {/* Employee */}

          {!form.isForAll && (

            <div>

              <label className="text-sm text-gray-400">
                Select Employee
              </label>

              <select
                required
                className="w-full p-2 bg-slate-700 rounded mt-1"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employeeId: e.target.value
                  })
                }
              >

                <option value="">
                  Select Employee
                </option>

                {employees.map(emp => (

                  <option
                    key={emp._id}
                    value={emp._id}
                  >

                    {emp.name} - {emp.department} - {emp.role}

                  </option>

                ))}

              </select>

            </div>

          )}


          {/* Amount */}

          <div>

            <label className="text-sm text-gray-400">
              Bonus Amount
            </label>

            <input
              type="number"
              required
              className="w-full p-2 bg-slate-700 rounded mt-1"
              placeholder="Enter Amount"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value
                })
              }
            />

          </div>


          {/* Month */}

          <div>

            <label className="text-sm text-gray-400">
              Month
            </label>

            <input
              type="month"
              required
              className="w-full p-2 bg-slate-700 rounded mt-1"
              value={form.month}
              onChange={(e) =>
                setForm({
                  ...form,
                  month: e.target.value
                })
              }
            />

          </div>


          {/* Reason */}

          <div>

            <label className="text-sm text-gray-400">
              Reason
            </label>

            <textarea
              className="w-full p-2 bg-slate-700 rounded mt-1"
              placeholder="Bonus Reason"
              value={form.reason}
              onChange={(e) =>
                setForm({
                  ...form,
                  reason: e.target.value
                })
              }
            />

          </div>


          {/* Button */}

          <button
            className="
            bg-gradient-to-r 
            from-indigo-500 
            to-purple-500 
            px-6 
            py-2 
            rounded-lg 
            hover:opacity-90
            "
          >

            Add Bonus

          </button>

        </form>

      </div>

    </div>

  );

};

export default AddBonus;