import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const HolidayManagement = () => {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({
    date: "",
    name: "",
    type: "public"
  });

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get("/holidays");
      setHolidays(data);
    } catch {
      toast.error("Failed to load holidays");
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // ➕ Add Holiday
  const handleAdd = async () => {
    try {
      await api.post("/holidays", form);
      toast.success("Holiday added");
      setForm({ date: "", name: "", type: "public" });
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  //  Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete holiday?")) return;

    try {
      await api.delete(`/holidays/${id}`);
      toast.success("Deleted");
      fetchHolidays();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-4 text-gray-800">🎉 Holiday Management</h1>

      {/* Add Form */}
      <div className="bg-white p-4 rounded shadow mb-6 grid md:grid-cols-3 gap-3">
        <input
          type="date"
          className="border p-2 rounded text-gray-600"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <input
          placeholder="Holiday Name"
          className="border p-2 rounded text-gray-600"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <select
          className="border p-2 rounded text-gray-600"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="public">Public</option>
          <option value="company">Company</option>
        </select>

        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white py-2 rounded md:col-span-3"
        >
          Add Holiday
        </button>
      </div>

      {/* Holiday List */}
      <div className="bg-white rounded shadow">
        <table className="w-full text-center">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="p-2">Date</th>
              <th>Name</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {holidays.map((h) => (
              <tr key={h._id} className="border-t">
                <td className="text-gray-700">{h.date}</td>
                <td className="text-gray-700">{h.name}</td>
                <td className="text-gray-700">{h.type}</td>
                <td>
                  <button
                    onClick={() => handleDelete(h._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HolidayManagement;