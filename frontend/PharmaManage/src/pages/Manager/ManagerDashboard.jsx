import React from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from "recharts";
import { 
  ClipboardCheck, Package, AlertCircle, Users, 
  CheckCircle2, Clock, Beaker, FileText 
} from "lucide-react";

// Mock Data for Departmental Performance
const productionData = [
  { day: "Mon", completed: 12, pending: 4 },
  { day: "Tue", completed: 18, pending: 2 },
  { day: "Wed", completed: 15, pending: 7 },
  { day: "Thu", completed: 22, pending: 3 },
  { day: "Fri", completed: 19, pending: 5 },
];

const ManagerDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Manager", department: "Production" };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Department Overview</h1>
          <p className="text-slate-500">Managing <span className="text-emerald-600 font-semibold">{user.department}</span> unit operations</p>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="px-4 py-1 border-r">
            <p className="text-xs text-slate-400 uppercase font-bold">Shift Status</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Active
            </p>
          </div>
          <div className="px-4 py-1">
            <p className="text-xs text-slate-400 uppercase font-bold">Team Size</p>
            <p className="text-sm font-semibold text-slate-700">24 Members</p>
          </div>
        </div>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Active Batches", val: "08", icon: <Package />, color: "bg-blue-500" },
          { label: "Attendance Today", val: "92%", icon: <Users />, color: "bg-emerald-500" },
          { label: "Pending Approvals", val: "05", icon: <ClipboardCheck />, color: "bg-amber-500" },
          { label: "QC Alerts", val: "02", icon: <AlertCircle />, color: "bg-red-500" },
        ].map((item, i) => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={`${item.color} p-3 rounded-lg text-white`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{item.val}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Production Efficiency Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Beaker className="text-emerald-600" size={20}/> Weekly Batch Efficiency
            </h2>
            <select className="text-xs bg-slate-50 border rounded p-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '10px', border: 'none'}} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="pending" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Notifications */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4">Pending Requests</h2>
          <div className="space-y-4">
            {[
              { type: "Leave", user: "Rahul Sharma", desc: "Medical Leave - 2 Days", time: "10m ago" },
              { type: "Stock", user: "Inventory", desc: "Low Reagent Grade A", time: "1h ago" },
              { type: "QC", user: "Lab Tech", desc: "Batch #102 Final Review", time: "3h ago" },
            ].map((req, i) => (
              <div key={i} className="group p-3 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                    {req.type}
                  </span>
                  <span className="text-[10px] text-slate-400">{req.time}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{req.user}</p>
                <p className="text-xs text-slate-500">{req.desc}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition">
            View All Notifications
          </button>
        </div>
      </div>

      {/* Detailed Batch Status Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={20}/> Active Production Batches
          </h2>
          <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition">
            Start New Batch
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Batch ID</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {[
                { id: "#B-90211", name: "Amoxicillin 500mg", user: "Arjun K.", progress: 75, status: "Processing" },
                { id: "#B-90212", name: "Paracetamol Syrup", user: "Saira V.", progress: 100, status: "Completed" },
                { id: "#B-90213", name: "Vitamin C Chewable", user: "Amit P.", progress: 30, status: "Pending QC" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{row.name}</td>
                  <td className="px-6 py-4 text-slate-500">{row.user}</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${row.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;