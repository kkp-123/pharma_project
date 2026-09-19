import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id;

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      const userData = res.data?.user || res.data;
      setUser(userData);

      setForm({
        name: userData?.name || "",
        email: userData?.email || "",
        password: ""
      });
    } catch {
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const handleUpdate = async () => {
    try {
      await api.put(`/users/profile/${userId}`, form);
      toast.success("Profile updated");
      setOpen(false);
      fetchProfile();
    } catch {
      toast.error("Update failed");
    }
  };

  if (!user) {
    return (
      <h2 className="text-center mt-10 text-gray-700 dark:text-gray-300">
        Loading...
      </h2>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center p-6 bg-gray-100 dark:bg-gray-900 transition-colors">

      {/* PROFILE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center p-8 rounded-2xl shadow-xl
                   bg-white dark:bg-gray-800
                   text-gray-800 dark:text-gray-100"
      >
        <div className="w-20 h-20 mx-auto rounded-full 
                        bg-indigo-600 dark:bg-indigo-500
                        text-white flex items-center justify-center text-2xl font-bold mb-4">
          {user.name?.charAt(0)}
        </div>

        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-gray-500 dark:text-gray-300">{user.email}</p>

        <p className="text-sm text-gray-400 mt-2">
          Department: {user.department}
        </p>
        <p className="text-sm text-gray-400">
          Role: {user.role}
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-6 px-4 py-2 rounded-lg
                     bg-indigo-600 hover:bg-indigo-700
                     dark:bg-indigo-500 dark:hover:bg-indigo-600
                     text-white transition"
        >
          Edit Profile
        </button>
      </motion.div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="w-96 p-6 rounded-xl shadow-lg
                          bg-white dark:bg-gray-800
                          text-gray-800 dark:text-gray-100">

            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

            <input
              className="w-full mb-3 p-2 border rounded
                         bg-gray-50 dark:bg-gray-700
                         text-gray-800 dark:text-white"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full mb-3 p-2 border rounded
                         bg-gray-50 dark:bg-gray-700
                         text-gray-800 dark:text-white"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              placeholder="New Password"
              className="w-full mb-4 p-2 border rounded
                         bg-gray-50 dark:bg-gray-700
                         text-gray-800 dark:text-white"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="px-3 py-1 rounded text-white
                           bg-indigo-600 hover:bg-indigo-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;