import React, { useState } from "react";
import HRDashboard from "../HR Department/HRDashboard";
import QCDashboard from "../QC Department/QCDashboard";
import ProductionDashboard from "../Production Department/ProductionDashboard";
import Inventory from "../Inventory Department/Inventory";
import SalesDashboard from "../Sales Department/SalesDashboard";

/**
 * ManagerDashboard2: Central Department Manager Router
 * Dynamically routes to the manager's dedicated department dashboard:
 * - HR Department -> HRDashboard
 * - QC Department -> QCDashboard
 * - Production Department -> ProductionDashboard
 * - Inventory Department -> Inventory
 * - Sales Department -> SalesDashboard
 */
const ManagerDashboard2 = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const defaultDept = user.department || "Production";

  // Admins can toggle between all department dashboards
  const [selectedDept, setSelectedDept] = useState(defaultDept);

  const activeDept = user.role === "admin" ? selectedDept : user.department || "Production";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Admin Department Switcher Bar (Only visible if Admin is inspecting Manager View) */}
      {user.role === "admin" && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Admin Department View Mode:
          </div>
          <div className="flex items-center gap-2">
            {["HR", "QC", "Production", "Inventory", "Sales"].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeDept === dept
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Department Dashboard Rendering */}
      {activeDept === "HR" ? (
        <HRDashboard />
      ) : activeDept === "QC" ? (
        <QCDashboard />
      ) : activeDept === "Inventory" ? (
        <Inventory />
      ) : activeDept === "Sales" ? (
        <SalesDashboard />
      ) : (
        <ProductionDashboard />
      )}
    </div>
  );
};

export default ManagerDashboard2;