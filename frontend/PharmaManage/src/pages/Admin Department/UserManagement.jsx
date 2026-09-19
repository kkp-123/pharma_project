import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import FaceRegistrationModal from "../../components/FaceRegistrationModal";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ScanFace,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  X
} from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterFace, setFilterFace] = useState("ALL");
  const [search, setSearch] = useState("");

  // Edit Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    salary: 0,
    isActive: true
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Face Registration Modal
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [selectedEmployeeForFace, setSelectedEmployeeForFace] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data?.users || (Array.isArray(res.data) ? res.data : []));
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (filterRole !== "ALL" && u.role !== filterRole) return false;
    if (filterDept !== "ALL" && u.department !== filterDept) return false;
    if (filterFace === "REGISTERED" && !u.faceData?.registered) return false;
    if (filterFace === "NOT_REGISTERED" && u.faceData?.registered) return false;
    if (search) {
      const matchName = u.name?.toLowerCase().includes(search.toLowerCase());
      const matchEmail = u.email?.toLowerCase().includes(search.toLowerCase());
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  // Delete User
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  // Remove Face Data
  const handleRemoveFace = async (user) => {
    if (!window.confirm(`Remove registered face descriptor for ${user.name}? This will disable face attendance for them.`)) return;

    try {
      await api.delete(`/users/${user._id}/face`);
      toast.success(`Face registration removed for ${user.name}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove face data");
    }
  };

  // Open Edit Modal
  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      salary: user.salary || 0,
      isActive: user.isActive
    });
  };

  // Submit Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEdit(true);
      await api.put(`/users/${selectedUser._id}`, editForm);
      toast.success("User profile updated successfully");
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error("Update failed");
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users size={14} /> Personnel Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            User & Face Biometric Management
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage company employees, managers, role permissions, and facial recognition biometric templates.
          </p>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
          />
        </div>

        {/* Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="employee">Employees</option>
          <option value="manager">Managers</option>
          <option value="admin">Admins</option>
        </select>

        {/* Department Filter */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Departments</option>
          <option value="Production">Production</option>
          <option value="QC">QC</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
          <option value="Inventory">Inventory</option>
        </select>

        {/* Face Status Filter */}
        <select
          value={filterFace}
          onChange={(e) => setFilterFace(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs px-3 py-2 rounded-xl text-white outline-none"
        >
          <option value="ALL">All Face Statuses</option>
          <option value="REGISTERED">✅ Face Registered</option>
          <option value="NOT_REGISTERED">❌ Face Not Registered</option>
        </select>
      </div>

      {/* 3. User Cards Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <motion.div
              key={u._id}
              whileHover={{ y: -4 }}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col justify-between"
            >
              <div>
                {/* Avatar & Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm truncate">{u.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Details Badges */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-200">{u.department || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="capitalize font-semibold text-indigo-300">{u.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={u.isActive ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Face Status Badge */}
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-slate-400">Face Biometrics:</span>
                    {u.faceData?.registered ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✅ Registered
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ❌ Not Registered
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeForFace(u);
                    setFaceModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <ScanFace size={14} />
                  {u.faceData?.registered ? "Update Face Data" : "Register Face"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                  >
                    Edit
                  </button>
                  {u.faceData?.registered && (
                    <button
                      onClick={() => handleRemoveFace(u)}
                      className="p-1.5 bg-amber-950/40 hover:bg-amber-800 text-amber-300 rounded-lg text-xs transition border border-amber-800/40"
                      title="Clear Face Data"
                    >
                      <ScanFace size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(u._id, u.name)}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-800 text-rose-300 rounded-lg text-xs transition border border-rose-800/40"
                    title="Delete User"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-500 text-sm">
            No personnel found matching the chosen search and filter criteria.
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit User Profile</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Production">Production</option>
                  <option value="QC">QC</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Inventory">Inventory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Account Status</label>
                <select
                  value={String(editForm.isActive)}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive / Deactivated</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {submittingEdit ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Registration Modal */}
      {selectedEmployeeForFace && (
        <FaceRegistrationModal
          isOpen={faceModalOpen}
          employee={selectedEmployeeForFace}
          onClose={() => {
            setFaceModalOpen(false);
            setSelectedEmployeeForFace(null);
          }}
          onSuccess={() => {
            setFaceModalOpen(false);
            setSelectedEmployeeForFace(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;