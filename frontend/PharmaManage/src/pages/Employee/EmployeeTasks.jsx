import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";


const EmployeeTasks = () => {

  const user = JSON.parse(localStorage.getItem("user"));
  const [tasks, setTasks] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});

  //Fetch tasks
  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/tasks/employee");
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Update progress
  const updateProgress = async (id, progress) => {
    try {
      await api.put(`/tasks/${id}/progress`, { progress });

      setTasks(prev =>
        prev.map(t =>
          t._id === id ? { ...t, progress } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Add comment
  const addComment = async (taskId) => {
    const text = commentInputs[taskId];

    if (!text) return;

    try {
      await api.post(`/tasks/${taskId}/comment`, { text });

      setCommentInputs(prev => ({
        ...prev,
        [taskId]: ""
      }));

      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const myTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-3xl font-bold mb-6">
        📋 My Tasks
      </h1>

      <div className="grid md:grid-cols-2 gap-5">

        {myTasks.map(task => (
          <motion.div
            key={task._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 p-5 rounded-2xl shadow-lg"
          >

            {/* Task Info */}
            <h2 className="text-lg font-semibold">
              {task.title}
            </h2>

            <p className="text-sm text-slate-400">
              {task.description}
            </p>

            <p className="text-xs mt-1">
              👨‍💼 Manager: {task.manager?.name}
            </p>

            <p className="text-xs">
              📅 {new Date(task.dueDate).toDateString()}
            </p>

            {/*  STATUS */}
            <span
              className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                task.status === "completed"
                  ? "bg-green-600"
                  : task.status === "in-progress"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-500"
              }`}
            >
              {task.status}
            </span>

            {/* PROGRESS BAR */}
            <div className="mt-3">
              <div className="w-full bg-slate-700 h-2 rounded-full">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>

              <p className="text-xs mt-1">
                {task.progress}% completed
              </p>
            </div>

            {/* SLIDER */}
            <div className="mt-3">
              <label className="text-xs text-slate-300">
                Update Progress
              </label>

              <input
                type="range"
                min="0"
                max="100"
                value={task.progress}
                onChange={(e) =>
                  updateProgress(task._id, Number(e.target.value))
                }
                className="w-full mt-1"
              />
            </div>

            {/* COMMENTS */}
            <div className="mt-4">

              <h3 className="text-sm font-semibold mb-2">
                💬 Comments
              </h3>

              {/* Existing comments */}
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {task.comments?.map((c, i) => (
                  <p
                    key={i}
                    className="text-xs bg-slate-700 p-2 rounded"
                  >
                    {c.text}
                  </p>
                ))}
              </div>

              {/* Add comment */}
              <div className="flex gap-2 mt-2">
                <input
                  value={commentInputs[task._id] || ""}
                  onChange={(e) =>
                    setCommentInputs({
                      ...commentInputs,
                      [task._id]: e.target.value
                    })
                  }
                  placeholder="Add comment..."
                  className="flex-1 p-1 text-sm bg-slate-700 rounded"
                />

                <button
                  onClick={() => addComment(task._id)}
                  className="bg-indigo-500 px-3 rounded hover:bg-indigo-600"
                >
                  Send
                </button>
              </div>

            </div>

          </motion.div>
        ))}

      </div>
    </div>
  );
};

export default EmployeeTasks;