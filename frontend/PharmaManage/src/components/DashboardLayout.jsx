import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

const DashboardLayout = () => {
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const token = user.token;
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("user");
          return <Navigate to="/login" replace />;
        }
      }
    }
  } catch (err) {
    console.error("Token verification error:", err);
  }

  return (
    <div className="flex bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 min-h-screen">

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static z-50
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        
        w-64 
        bg-white/5 
        backdrop-blur-xl 
        border-r border-white/10
        p-4
        min-h-screen
        transition-transform duration-300
        `}
      >

        <div className="flex justify-between items-center mb-6 text-white">

          <h1 className="
          text-xl font-bold
          bg-gradient-to-r
          from-indigo-400
          to-purple-400
          bg-clip-text text-transparent
          ">
            PharmaSys
          </h1>

          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>

        </div>

        <Sidebar
          role={user.role}
          department={user.department}
          open={true}
        />

      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* Mobile Header */}
        <div className="lg:hidden p-4 text-white">
          <button onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </div>

        <Outlet />

      </div>

    </div>
  );
};

export default DashboardLayout;