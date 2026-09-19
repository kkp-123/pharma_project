import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Settings,
  DollarSign,
  CheckSquare,
  Bell,
  User,
  FileText,
  ShieldAlert,
  Beaker,
  Factory,
  ShoppingBag,
  CreditCard,
  Calendar,
  Layers,
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react";

/**
 * Unified Comprehensive Sidebar Component
 * Combines all department workflows, manager operations, admin tooling, and employee portals.
 */
const Sidebar = ({ role, department, open = true }) => {
  const location = useLocation();

  // If department not passed as prop, fallback to localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = role || storedUser.role || "employee";
  const userDept = department || storedUser.department || "Production";

  // Icon Dictionary
  const icons = {
    dashboard: LayoutDashboard,
    users: Users,
    product: Package,
    inventory: ClipboardList,
    settings: Settings,
    salary: DollarSign,
    task: CheckSquare,
    attendance: FileText,
    audit: ShieldAlert,
    qc: Beaker,
    factory: Factory,
    sales: ShoppingBag,
    payment: CreditCard,
    holiday: Calendar,
    bonus: Award,
    profile: User,
    default: Layers
  };

  //
  // Comprehensive Menu Structure for All Roles & Departments
  //
  const menuConfig = {
    //
    // 👑 ADMIN MENU (Full Company Access)
    //
    admin: [
      { section: "OVERVIEW" },
      { name: "Admin Dashboard", path: "/dashboard/admin", icon: icons.dashboard },
      { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

      { section: "USER & HR MANAGEMENT" },
      { name: "Create User", path: "/dashboard/admin/signup", icon: icons.users },
      { name: "Manage Users & Biometrics", path: "/dashboard/admin/userManagement", icon: icons.users },
      { name: "Attendance Reports", path: "/dashboard/admin/attendanceDashboard", icon: icons.attendance },
      { name: "Salary Dashboard", path: "/dashboard/admin/salaryDashboard", icon: icons.salary },
      { name: "Add Bonus", path: "/dashboard/admin/addBonus", icon: icons.bonus },
      { name: "Bonus History", path: "/dashboard/admin/bonusHistory", icon: icons.bonus },

      { section: "OPERATIONS & SALES" },
      { name: "Products List", path: "/dashboard/admin/allProducts", icon: icons.product },
      { name: "Create Product", path: "/dashboard/admin/adminCreateProduct", icon: icons.product },
      { name: "Warehouse Inventory", path: "/dashboard/admin/inventory", icon: icons.inventory },
      { name: "Sales Dashboard", path: "/dashboard/sales", icon: icons.sales },
      { name: "Sales Payments", path: "/dashboard/sales/payments", icon: icons.payment },

      { section: "SYSTEM & AUDIT" },
      { name: "Office Geofence Settings", path: "/dashboard/admin/locationSettings", icon: icons.settings },
      { name: "Audit Trail Logs", path: "/dashboard/admin/auditLogs", icon: icons.audit }
    ],

    //
    // 🏢 DEPARTMENT MANAGERS
    //
    manager: {
      // 🏭 Production Manager
      Production: [
        { section: "DASHBOARD" },
        { name: "Production Dashboard", path: "/dashboard/manager", icon: icons.factory },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "MANUFACTURING" },
        { name: "Add Batch", path: "/dashboard/manager/addBatch", icon: icons.product },
        { name: "Production Demands", path: "/dashboard/production-demand", icon: icons.inventory },
        { name: "Production Requests", path: "/dashboard/productionRequests", icon: icons.factory },
        { name: "Warehouse Stock", path: "/dashboard/admin/inventory", icon: icons.inventory },

        { section: "TEAM MANAGEMENT" },
        { name: "Task Management", path: "/dashboard/manager/taskManagement", icon: icons.task },
        { name: "Leave Approvals", path: "/dashboard/manager/managerLeaves", icon: icons.task },
        { name: "Team Attendance", path: "/dashboard/manager/departmentAttendance", icon: icons.attendance },

        { section: "PERSONAL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Salary", path: "/dashboard/manager/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      // 🔬 Quality Control (QC) Manager
      QC: [
        { section: "DASHBOARD" },
        { name: "QC Dashboard", path: "/dashboard/manager", icon: icons.qc },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "QUALITY ASSURANCE" },
        { name: "Quality Check Lab", path: "/dashboard/manager/QC", icon: icons.qc },
        { name: "QC Inspection History", path: "/dashboard/manager/qcHistory", icon: icons.inventory },

        { section: "TEAM MANAGEMENT" },
        { name: "Task Management", path: "/dashboard/manager/taskManagement", icon: icons.task },
        { name: "Leave Approvals", path: "/dashboard/manager/managerLeaves", icon: icons.task },
        { name: "Team Attendance", path: "/dashboard/manager/departmentAttendance", icon: icons.attendance },

        { section: "PERSONAL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Salary", path: "/dashboard/manager/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      // 👩‍💼 Human Resources (HR) Manager
      HR: [
        { section: "DASHBOARD" },
        { name: "HR Dashboard", path: "/dashboard/manager", icon: icons.users },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "PERSONNEL & HOLIDAYS" },
        { name: "Holiday Management", path: "/dashboard/manager/holidayManagement", icon: icons.holiday },
        { name: "Leave Approvals", path: "/dashboard/manager/managerLeaves", icon: icons.task },
        { name: "Task Management", path: "/dashboard/manager/taskManagement", icon: icons.task },
        { name: "Department Attendance", path: "/dashboard/manager/departmentAttendance", icon: icons.attendance },

        { section: "PERSONAL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Salary", path: "/dashboard/manager/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      // 💼 Commercial Sales Manager
      Sales: [
        { section: "DASHBOARD" },
        { name: "Sales Dashboard", path: "/dashboard/sales", icon: icons.sales },
        { name: "Manager Summary", path: "/dashboard/manager", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "SALES OPERATIONS" },
        { name: "Create Sale Order", path: "/dashboard/sales/create", icon: icons.product },
        { name: "Sales Orders Pipeline", path: "/dashboard/sales/orders", icon: icons.sales },
        { name: "Sales Payments & Dues", path: "/dashboard/sales/payments", icon: icons.payment },

        { section: "TEAM MANAGEMENT" },
        { name: "Task Management", path: "/dashboard/manager/taskManagement", icon: icons.task },
        { name: "Leave Approvals", path: "/dashboard/manager/managerLeaves", icon: icons.task },
        { name: "Team Attendance", path: "/dashboard/manager/departmentAttendance", icon: icons.attendance },

        { section: "PERSONAL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Salary", path: "/dashboard/manager/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      // 📦 Warehouse Inventory Manager
      Inventory: [
        { section: "DASHBOARD" },
        { name: "Inventory Dashboard", path: "/dashboard/admin/inventory", icon: icons.inventory },
        { name: "Manager Summary", path: "/dashboard/manager", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "TEAM MANAGEMENT" },
        { name: "Task Management", path: "/dashboard/manager/taskManagement", icon: icons.task },
        { name: "Leave Approvals", path: "/dashboard/manager/managerLeaves", icon: icons.task },
        { name: "Team Attendance", path: "/dashboard/manager/departmentAttendance", icon: icons.attendance },

        { section: "PERSONAL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Salary", path: "/dashboard/manager/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ]
    },

    //
    // 👤 EMPLOYEES
    //
    employee: {
      Production: [
        { section: "MAIN" },
        { name: "My Dashboard", path: "/dashboard/employee", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "WORK & TASKS" },
        { name: "My Tasks", path: "/dashboard/employee/tasks", icon: icons.task },
        { name: "Production Tasks", path: "/dashboard/employeeProduction", icon: icons.factory },

        { section: "ATTENDANCE & PAYROLL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Leaves", path: "/dashboard/employee/myLeaves", icon: icons.task },
        { name: "My Salary", path: "/dashboard/employee/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      QC: [
        { section: "MAIN" },
        { name: "My Dashboard", path: "/dashboard/employee", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "WORK & TASKS" },
        { name: "My Tasks", path: "/dashboard/employee/tasks", icon: icons.task },

        { section: "ATTENDANCE & PAYROLL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Leaves", path: "/dashboard/employee/myLeaves", icon: icons.task },
        { name: "My Salary", path: "/dashboard/employee/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      Sales: [
        { section: "MAIN" },
        { name: "My Dashboard", path: "/dashboard/employee", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "SALES & TASKS" },
        { name: "My Tasks", path: "/dashboard/employee/tasks", icon: icons.task },
        { name: "Create Sale Order", path: "/dashboard/sales/create", icon: icons.product },
        { name: "Sales Orders", path: "/dashboard/sales/orders", icon: icons.sales },

        { section: "ATTENDANCE & PAYROLL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Leaves", path: "/dashboard/employee/myLeaves", icon: icons.task },
        { name: "My Salary", path: "/dashboard/employee/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      HR: [
        { section: "MAIN" },
        { name: "My Dashboard", path: "/dashboard/employee", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "WORK & TASKS" },
        { name: "My Tasks", path: "/dashboard/employee/tasks", icon: icons.task },

        { section: "ATTENDANCE & PAYROLL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Leaves", path: "/dashboard/employee/myLeaves", icon: icons.task },
        { name: "My Salary", path: "/dashboard/employee/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ],

      Inventory: [
        { section: "MAIN" },
        { name: "My Dashboard", path: "/dashboard/employee", icon: icons.dashboard },
        { name: "My Profile", path: "/dashboard/profile", icon: icons.profile },

        { section: "WORK & TASKS" },
        { name: "My Tasks", path: "/dashboard/employee/tasks", icon: icons.task },

        { section: "ATTENDANCE & PAYROLL" },
        { name: "My Attendance", path: "/dashboard/myAttendance", icon: icons.attendance },
        { name: "My Leaves", path: "/dashboard/employee/myLeaves", icon: icons.task },
        { name: "My Salary", path: "/dashboard/employee/mySalary", icon: icons.salary },
        { name: "My Bonus", path: "/dashboard/myBonus", icon: icons.bonus }
      ]
    }
  };

  //
  // Select active menu items list
  //
  let menuList = [];

  if (userRole === "admin") {
    menuList = menuConfig.admin;
  } else if (userRole === "manager") {
    menuList = menuConfig.manager[userDept] || menuConfig.manager.Production;
  } else {
    menuList = menuConfig.employee[userDept] || menuConfig.employee.Production;
  }

  return (
    <div className="flex flex-col gap-1 text-white pb-8">
      {/* Role & Department Info Badge */}
      {open && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] flex items-center justify-between">
          <div>
            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px] block">
              {userRole} Workspace
            </span>
            <span className="text-slate-400 font-medium">
              {userRole === "admin" ? "All Departments" : `${userDept} Department`}
            </span>
          </div>
          <Sparkles size={14} className="text-indigo-400" />
        </div>
      )}

      {/* Navigation Items */}
      {menuList.map((item, index) => {
        // Section Header
        if (item.section) {
          if (!open) return <div key={index} className="my-1 border-t border-white/5" />;
          return (
            <div
              key={index}
              className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              {item.section}
            </div>
          );
        }

        const Icon = item.icon || icons.default;
        const active = location.pathname === item.path;

        return (
          <Link
            key={index}
            to={item.path}
            className={`
              flex items-center justify-between
              px-3 py-2 rounded-xl
              transition-all duration-200 text-xs font-semibold
              ${
                active
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
              {open && <span>{item.name}</span>}
            </div>

            {open && active && <ChevronRight size={14} className="text-white/70" />}
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;