import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FaceRegistrationModal from "../../components/FaceRegistrationModal";
import {
  UserPlus,
  ScanFace,
  CheckCircle2,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  UserCheck
} from "lucide-react";

const AdminCreateUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "Production",
    manager: "",
    salary: "",
    phone: "",
    address: "",
    joiningDate: new Date().toISOString().split("T")[0]
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Step 2 Face Registration state
  const [createdUser, setCreatedUser] = useState(null);
  const [faceModalOpen, setFaceModalOpen] = useState(false);

  const filteredManagers = managers.filter(
    (m) => m.department === form.department
  );

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await api.get("/auth/getManagers");
      setManagers(res.data || []);
    } catch (err) {
      toast.error("Failed to load managers list");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.department || !form.salary) {
      return toast.error("All required fields must be filled");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error("Invalid email address");
    }

    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (form.role === "employee" && !form.manager) {
      return toast.error("Please assign a department manager");
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/create-user", {
        ...form,
        salary: Number(form.salary)
      });

      const newUser = res.data?.user;
      toast.success("User created successfully!");
      setCreatedUser(newUser);

      // Reset form
      setForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department: "Production",
        manager: "",
        salary: "",
        phone: "",
        address: "",
        joiningDate: new Date().toISOString().split("T")[0]
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Employee / Manager</h2>
            <p className="text-xs text-slate-400">Step 1: Enter profile details • Step 2: Register employee face</p>
          </div>
        </div>

        {/* Step 2 Prompt Card (if user was just created) */}
        {createdUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={32} className="text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-200 text-sm">
                  Employee Created: {createdUser.name}
                </h4>
                <p className="text-xs text-emerald-300/80">
                  Ready for Step 2: Register biometric face template for attendance.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFaceModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shrink-0"
            >
              <ScanFace size={16} /> Register Face Now
            </button>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Dr. Rajesh Patel"
                required
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="rajesh@pharmasys.com"
                required
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              >
                <option value="Production">Production</option>
                <option value="QC">Quality Control (QC)</option>
                <option value="HR">Human Resources (HR)</option>
                <option value="Sales">Sales</option>
                <option value="Inventory">Inventory / Warehouse</option>
              </select>
            </div>

            {/* Manager Selection (if Employee) */}
            {form.role === "employee" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reporting Manager *</label>
                <select
                  name="manager"
                  value={form.manager}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="">Select Manager</option>
                  {filteredManagers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Salary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Monthly Salary (₹) *</label>
              <input
                type="number"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="50000"
                required
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Joining Date</label>
              <input
                type="date"
                name="joiningDate"
                value={form.joiningDate}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Address */}
            <div className={form.role === "employee" ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="City, State"
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-3.5 rounded-xl text-white font-bold text-sm transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating User..." : "Create Employee Profile"}
          </button>
        </form>
      </div>

      {/* Face Registration Modal */}
      {createdUser && (
        <FaceRegistrationModal
          isOpen={faceModalOpen}
          employee={createdUser}
          onClose={() => setFaceModalOpen(false)}
          onSuccess={() => {
            setFaceModalOpen(false);
            setCreatedUser(null);
            navigate("/dashboard/admin/userManagement");
          }}
        />
      )}
    </div>
  );
};

export default AdminCreateUser;