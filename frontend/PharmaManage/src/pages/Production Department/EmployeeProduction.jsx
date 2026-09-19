import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const MyProductionTasks = () => {

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskActionLoadingId, setTaskActionLoadingId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  // =========================
  // GET MY TASKS
  // =========================
  const fetchTasks = async () => {
    try {
      const res = await api.get("/production-demand/my");
      setTasks(res.data?.demands || (Array.isArray(res.data) ? res.data : []));
      setLoading(false);
    } catch (err) {
      console.log(err);
      setTasks([]);
      setLoading(false);
    }
  };

  // =========================
  // START TASK
  // =========================
  const startTask = async (id) => {
    if (taskActionLoadingId) return;
    try {
      setTaskActionLoadingId(id);
      await api.put(`/production-demand/start/${id}`);
      toast.success("Task Started");
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error starting task");
    } finally {
      setTaskActionLoadingId(null);
    }
  };

  // =========================
  // COMPLETE TASK
  // =========================
  const completeTask = async (id) => {
    if (taskActionLoadingId) return;
    try {
      setTaskActionLoadingId(id);
      const res = await api.put(`/production-demand/complete/${id}`);
      toast.success(res.data?.message || "Task Completed & Batch dispatched to QC!");
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error completing task");
    } finally {
      setTaskActionLoadingId(null);
    }
  };

  // =========================
  // STATUS COLOR
  // =========================
  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-500";
      case "in-production":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        My Production Tasks
      </h1>

      {/* TASK LIST */}
      <div className="grid md:grid-cols-2 gap-6">

        {tasks.length === 0 ? (
          <p className="text-gray-400">
            No tasks assigned
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-slate-800 p-5 rounded-xl shadow-lg"
            >

              {/* HEADER */}
              <div className="flex justify-between items-center mb-3">

                <h2 className="font-bold text-lg">
                  {task.product?.name}
                </h2>

                <span
                  className={`px-2 py-1 text-xs rounded ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>

              </div>

              {/* INFO */}
              <div className="space-y-1 text-sm text-gray-300">

                <p>
                  Quantity:{" "}
                  <span className="text-white">
                    {task.quantity}
                  </span>
                </p>

                <p>
                  Assigned By:{" "}
                  <span className="text-white">
                    {task.assignedBy?.name || "Manager"}
                  </span>
                </p>

                <p>
                  Assigned Date:{" "}
                  <span className="text-white">
                    {task.assignedDate
                      ? new Date(
                          task.assignedDate
                        ).toLocaleDateString()
                      : "-"}
                  </span>
                </p>

              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-4 flex gap-2">

                {task.status === "assigned" && (
                  <button
                    disabled={taskActionLoadingId === task._id}
                    onClick={() => startTask(task._id)}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-3 py-2 rounded text-xs font-semibold transition"
                  >
                    {taskActionLoadingId === task._id ? "Starting..." : "Start Work"}
                  </button>
                )}

                {task.status === "in-production" && (
                  <button
                    disabled={taskActionLoadingId === task._id}
                    onClick={() => completeTask(task._id)}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-3 py-2 rounded text-xs font-semibold transition"
                  >
                    {taskActionLoadingId === task._id ? "Completing..." : "Mark Completed"}
                  </button>
                )}

                {task.status === "completed" && (
                  <span className="text-green-400 text-sm">
                    ✔ Completed
                  </span>
                )}

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
};

export default MyProductionTasks;