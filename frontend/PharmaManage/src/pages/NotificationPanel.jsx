import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from ".././services/api";
import socket from ".././socket";
import { toast } from "react-hot-toast";

const NotificationPanel = ({ open }) => {
  const [notifications, setNotifications] = useState([]);

  // Fetch
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : (data?.notifications || []));
    } catch (err) {
      console.log(err);
      setNotifications([]);
    }
  };

  // 🔹 Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // SOCKET LISTENERS
  useEffect(() => {
    const handleNew = (data) => {

       toast.success(data.message, {
      duration: 3000,
      style: {
        background: "#1e293b",
        color: "#fff",
      },
    });

      setNotifications((prev) => [data, ...prev]);
    };

    const handleUpdate = () => {
      fetchNotifications(); // fallback sync
    };

    socket.on("newNotification", handleNew);
    socket.on("notificationUpdated", handleUpdate);

    return () => {
      socket.off("newNotification", handleNew);
      socket.off("notificationUpdated", handleUpdate);
    };
  }, []);

  //  MARK AS READ (instant UI update)
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);

      //update UI instantly
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        )
      );

      //optional emit (if backend not doing it)
      socket.emit("notificationUpdated");

    } catch (err) {
      console.log(err);
    }
  };

  // DELETE (instant UI update)
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);

      //  remove instantly
      setNotifications((prev) =>
        prev.filter((n) => n._id !== id)
      );

      socket.emit("notificationUpdated");

    } catch (err) {
      console.log(err);
    }
  };

  //CLEAR ALL
  const clearAll = async () => {
    try {
      await api.delete("/notifications");

      // clear UI instantly
      setNotifications([]);

      socket.emit("notificationUpdated");

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 top-12 w-80 bg-slate-800 text-white shadow-2xl rounded-2xl p-4 z-50"
        >
          <div className="flex justify-between mb-3">
            <h2> Notifications</h2>
            {notifications.length > 0 && (
              <button onClick={clearAll}>Clear</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-2 border-b flex justify-between items-center ${
                  n.isRead ? "opacity-50" : "font-semibold"
                }`}
              >
                <p
                  onClick={() => markRead(n._id)}
                  className="cursor-pointer"
                >
                  {n.message}
                </p>

                <button
                  onClick={() => deleteNotification(n._id)}
                  className="text-red-400"
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;