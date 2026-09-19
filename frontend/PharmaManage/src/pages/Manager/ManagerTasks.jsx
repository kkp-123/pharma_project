import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

const ManagerTasks = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    employee: "",
    dueDate: ""
  });

  const [editTask, setEditTask] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/tasks/manager");
      setTasks(Array.isArray(data) ? data : (data?.tasks || []));
    } catch {
      setTasks([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get("/users/department");
      setEmployees(Array.isArray(data) ? data : (data?.employees || []));
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  // Create
  const createTask = async (e) => {
    e.preventDefault();

    await api.post("/tasks", {
      ...form,
      department: user.department
    });

    setForm({ title: "", description: "", employee: "", dueDate: "" });
    fetchTasks();
  };

  // Update Task
  const updateTask = async () => {
    await api.put(`/tasks/${editTask._id}`, editTask);
    setEditTask(null);
    fetchTasks();
  };

  // Add Comment
  const addComment = async (id) => {
    const text = commentInputs[id];
    if (!text) return;

    await api.post(`/tasks/${id}/comment`, { text });

    setCommentInputs(prev => ({ ...prev, [id]: "" }));
    fetchTasks();
  };

  const filteredTasks =
    filter === "all"
      ? tasks
      : tasks.filter(t => t.status === filter);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-3xl font-bold mb-6">
        Manager Dashboard
      </h1>

      {/* ADD TASK FORM */}
      <form onSubmit={createTask} className="bg-slate-800 p-5 rounded-xl mb-6 grid gap-3">

        <h2 className="text-lg font-semibold">Assign Task</h2>

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e)=>setForm({...form,title:e.target.value})}
          className="p-2 bg-slate-700 rounded"
        />

        <input
          placeholder="Description"
          value={form.description}
          onChange={(e)=>setForm({...form,description:e.target.value})}
          className="p-2 bg-slate-700 rounded"
        />

        <select
          value={form.employee}
          onChange={(e)=>setForm({...form,employee:e.target.value})}
          className="p-2 bg-slate-700 rounded"
        >
          <option value="">Select Employee</option>
          {employees.map(emp=>(
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={form.dueDate}
          onChange={(e)=>setForm({...form,dueDate:e.target.value})}
          className="p-2 bg-slate-700 rounded"
        />

        <button className="bg-indigo-600 p-2 rounded">
           Create Task
        </button>

      </form>

      {/* FILTER */}
      <div className="flex gap-2 mb-5">
        {["all","pending","in-progress","completed"].map(f=>(
          <button
            key={f}
            onClick={()=>setFilter(f)}
            className={`px-3 py-1 rounded ${
              filter===f ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TASK LIST */}
      <div className="grid md:grid-cols-2 gap-4">

        {filteredTasks.map(task=>(
          <motion.div
            key={task._id}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800 p-5 rounded-xl"
          >

            <h2 className="font-semibold">{task.title}</h2>
            <p className="text-sm text-slate-400">{task.description}</p>

            <p className="text-xs mt-1">
               {task.employee?.name}
            </p>

            <p className="text-xs">
               {new Date(task.dueDate).toDateString()}
            </p>

            {/* STATUS */}
            <span className="text-xs bg-indigo-600 px-2 py-1 rounded">
              {task.status}
            </span>

            {/* PROGRESS */}
            <div className="mt-2">
              <div className="bg-slate-700 h-2 rounded-full">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <p className="text-xs">{task.progress}%</p>
            </div>

            {/* EDIT BUTTON */}
            <button
              onClick={()=>setEditTask(task)}
              className="mt-2 text-xs bg-yellow-500 px-2 py-1 rounded"
            >
              Edit
            </button>

            {/* COMMENTS */}
            <div className="mt-3">

              <div className="max-h-24 overflow-y-auto space-y-1">
                {task.comments?.map((c,i)=>(
                  <div key={i} className="bg-slate-700 p-2 rounded text-xs">
                    <p className="text-indigo-400 font-semibold">
                      {c.user?.name}
                    </p>
                    <p>{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  value={commentInputs[task._id] || ""}
                  onChange={(e)=>
                    setCommentInputs({
                      ...commentInputs,
                      [task._id]: e.target.value
                    })
                  }
                  placeholder="Add comment"
                  className="flex-1 p-1 bg-slate-700 rounded text-sm"
                />
                <button
                  onClick={()=>addComment(task._id)}
                  className="bg-indigo-500 px-2 rounded"
                >
                  Send
                </button>
              </div>

            </div>

          </motion.div>
        ))}

      </div>

      {/* EDIT MODAL */}
      {editTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">

          <div className="bg-slate-800 p-6 rounded-xl w-96">

            <h2 className="mb-3 font-semibold">Edit Task</h2>

            <input
              value={editTask.title}
              onChange={(e)=>setEditTask({...editTask,title:e.target.value})}
              className="p-2 bg-slate-700 w-full mb-2 rounded"
            />

            <input
              value={editTask.description}
              onChange={(e)=>setEditTask({...editTask,description:e.target.value})}
              className="p-2 bg-slate-700 w-full mb-2 rounded"
            />

            <input
              type="date"
              value={editTask.dueDate?.split("T")[0]}
              onChange={(e)=>setEditTask({...editTask,dueDate:e.target.value})}
              className="p-2 bg-slate-700 w-full mb-2 rounded"
            />

            <button
              onClick={updateTask}
              className="bg-green-500 w-full p-2 rounded"
            >
              Save Changes
            </button>

            <button
              onClick={()=>setEditTask(null)}
              className="mt-2 w-full p-2 bg-red-500 rounded"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default ManagerTasks;