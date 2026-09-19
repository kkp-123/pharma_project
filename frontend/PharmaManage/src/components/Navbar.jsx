import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import NotificationPanel from "../pages/NotificationPanel";
import socket from "../socket";
import api from "../services/api";
import toast from "react-hot-toast";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [mobile, setMobile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Register user
  useEffect(() => {
    if (user?._id) {
      socket.emit("register", user._id);
    }
  }, [user]);

  // Fetch notifications
  const fetchCount = async () => {
    try {
      const { data } = await api.get("/notifications");
      const list = Array.isArray(data) ? data : (data?.notifications || []);
      const unread = list.filter(
        (n) => !n.isRead && !n.isDeleted
      ).length;
      setCount(unread);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchCount();

    const handleNew = (data) => {
      toast.success(data.message);
      fetchCount();
    };

    const handleUpdate = () => {
      fetchCount();
    };

    socket.on("newNotification", handleNew);
    socket.on("notificationUpdated", handleUpdate);

    return () => {
      socket.off("newNotification", handleNew);
      socket.off("notificationUpdated", handleUpdate);
    };
  }, [user]);

  return (
    <>
      <nav
        className="
        bg-gradient-to-r 
        from-slate-900 
        via-indigo-900 
        to-slate-900
        border-b border-white/10
        px-4 md:px-6 py-4 
        flex justify-between 
        items-center 
        text-white
        shadow-lg
        relative
      "
      >
        {/* Logo */}
        <h1
          className="
          text-2xl 
          font-bold 
          bg-gradient-to-r 
          from-indigo-400 
          via-purple-400 
          to-pink-400 
          bg-clip-text 
          text-transparent
        "
        >
          PharmaSys
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">

          <Link to="/" className="hover:text-indigo-300">
            Home
          </Link>

          <Link to="/about" className="hover:text-indigo-300">
            About
          </Link>

          {user && (
            <Link
              to={`/dashboard/${user.role}`}
              className="hover:text-indigo-300"
            >
              Dashboard
            </Link>
          )}

          {!user ? (
            <Link to="/login">Login</Link>
          ) : (
            <button
              onClick={handleLogout}
              className="
              bg-red-500 
              px-3 
              py-1 
              rounded-lg
              hover:bg-red-600
            "
            >
              Logout
            </button>
          )}

        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">

          {/* Notification Always */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative text-xl"
            >
              🔔

              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>

            <NotificationPanel open={open} />
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>

        </div>
      </nav>

      {/* Mobile Menu */}

      <div
        className={`
        md:hidden
        bg-slate-900
        text-white
        transition-all duration-300
        overflow-hidden
        ${mobile ? "max-h-96 py-4" : "max-h-0"}
      `}
      >
        <div className="flex flex-col gap-4 px-6">

          <Link
            to="/"
            onClick={() => setMobile(false)}
          >
            Home
          </Link>

          <Link
            to="/about"
            onClick={() => setMobile(false)}
          >
            About
          </Link>

          {user && (
            <Link
              to={`/dashboard/${user.role}`}
              onClick={() => setMobile(false)}
            >
              Dashboard
            </Link>
          )}

          {!user ? (
            <Link
              to="/login"
              onClick={() => setMobile(false)}
            >
              Login
            </Link>
          ) : (
            <button
              onClick={() => {
                handleLogout();
                setMobile(false);
              }}
              className="text-left"
            >
              Logout
            </button>
          )}

        </div>
      </div>
    </>
  );
};

export default Navbar;