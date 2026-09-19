import { useEffect, useState } from "react";
import api from "../services/api";

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  const fetchAttendance = async () => {
    try {
      const res = await api.get(
        `/attendance/my?month=${month}`
      );
      setAttendance(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.log(err);
      setAttendance([]);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">
          My Attendance
        </h1>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-slate-800 p-2 rounded"
        />
      </div>

      {/* LIST */}
      <div className="space-y-3">

        {attendance.map((item) => (
          <div
            key={item._id}
            className="bg-slate-800 p-4 rounded-xl flex justify-between"
          >

            <div>
              <p className="font-semibold">
                {item.date}
              </p>

              <p className="text-sm text-gray-400">
                {item.checkIn &&
                  new Date(item.checkIn).toLocaleTimeString()}{" "}
                -{" "}
                {item.checkOut &&
                  new Date(item.checkOut).toLocaleTimeString()}
              </p>
            </div>

            <div className="text-right">
              <p className="capitalize">
                {item.status}
              </p>

              <p className="text-sm text-gray-400">
                {item.totalHours} hrs
              </p>
            </div>

          </div>
        ))}

        {attendance.length === 0 && (
          <p className="text-gray-400 text-center mt-10">
            No attendance found
          </p>
        )}

      </div>

    </div>
  );
};

export default MyAttendance;