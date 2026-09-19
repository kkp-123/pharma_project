import { useEffect, useState } from "react";
import api from ".././services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Download, FileText, CheckCircle2, Clock } from "lucide-react";
import { generatePayslipPDF } from "../utils/payslipGenerator";

const MySalaryDashboard = () => {
  const [salaries, setSalaries] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchSalaries = async () => {
    try {
      const res = await api.get("/salary/my");
      setSalaries(res.data?.salaries || (Array.isArray(res.data) ? res.data : []));
    } catch {
      toast.error("Failed to load salaries");
      setSalaries([]);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
          💼 My Compensation & Payslips
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Official monthly salary slips with corporate CTC breakdowns and tax summaries.
        </p>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salaries.map((salary) => (
          <motion.div
            key={salary._id}
            whileHover={{ y: -5 }}
            className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div>
              {/* MONTH & STATUS */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {salary.month}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {salary.payslipNumber || `PAY-${salary.month}`}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1 ${
                    salary.isPaid
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {salary.isPaid ? (
                    <>
                      <CheckCircle2 size={12} /> Disbursed
                    </>
                  ) : (
                    <>
                      <Clock size={12} /> In Review
                    </>
                  )}
                </span>
              </div>

              {/* DETAILS */}
              <div className="text-xs space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Base CTC:</span>
                  <span className="font-semibold">₹{salary.baseSalary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Basic Pay:</span>
                  <span>₹{(salary.basicPay || Math.round(salary.baseSalary * 0.5))?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HRA + Special Allowances:</span>
                  <span>₹{((salary.hra || 0) + (salary.specialAllowance || 0) + (salary.da || 0))?.toLocaleString()}</span>
                </div>
                {salary.bonus > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Performance Bonus:</span>
                    <span>+₹{salary.bonus?.toLocaleString()}</span>
                  </div>
                )}
                {salary.attendanceDeduction > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Attendance Deduction:</span>
                    <span>-₹{salary.attendanceDeduction?.toLocaleString()}</span>
                  </div>
                )}
                {salary.pf > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Provident Fund (PF):</span>
                    <span>-₹{salary.pf?.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                  <span className="text-white">Net Take-Home:</span>
                  <span className="text-emerald-400 text-base">₹{salary.netSalary?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ACTION */}
            <button
              onClick={() => generatePayslipPDF(salary, user)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition"
            >
              <Download size={15} />
              Download Official PDF Payslip
            </button>
          </motion.div>
        ))}

        {salaries.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>No compensation records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySalaryDashboard;