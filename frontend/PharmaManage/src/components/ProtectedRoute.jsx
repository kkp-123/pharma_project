import React from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

/**
 * ProtectedRoute component to enforce client-side role and authentication boundaries
 * @param {Array} allowedRoles - Array of allowed roles (e.g. ["admin"], ["manager", "admin"])
 * @param {Array} allowedDepartments - Optional array of allowed departments
 * @param {ReactNode} children - Target component
 */
const ProtectedRoute = ({ allowedRoles, allowedDepartments, children }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // 1. Check Authentication
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check Token Expiry
  try {
    const payload = JSON.parse(atob(user.token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("user");
      toast.error("Your session has expired. Please sign in again.");
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // 3. Check Role Authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error(`Access denied. You do not have permission to view this page.`);
    // Redirect to user's assigned dashboard
    const fallbackPath =
      user.role === "admin"
        ? "/dashboard/admin"
        : user.role === "manager"
        ? "/dashboard/manager"
        : "/dashboard/employee";

    return <Navigate to={fallbackPath} replace />;
  }

  // 4. Check Department Authorization (for managers/employees if specified)
  if (allowedDepartments && user.role !== "admin" && !allowedDepartments.includes(user.department)) {
    toast.error(`Access restricted for ${user.department} department.`);
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;

