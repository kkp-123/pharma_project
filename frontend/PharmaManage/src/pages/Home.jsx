import React from "react";
import { motion } from "framer-motion";
import { Users, Package, Shield, BarChart, CheckCircle, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent"
        >
          Welcome to PharmaSys Enterprise
        </motion.h1>

        <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-sm md:text-base">
          Complete Industrial Pharmaceutical Management: Active Batch Manufacturing, Laboratory QC Assays, Warehouse Inventory, Face-Biometric Attendance, and Commercial Sales.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition shadow-lg flex items-center gap-2"
          >
            Access Portal <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate("/about")}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl border border-slate-700 transition"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Core Industrial Modules
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Production & Processing Line",
              desc: "Manage production demands, assign shop-floor technicians, and track active drug formulation batches.",
              icon: <Package />
            },
            {
              title: "Quality Control (QC) & QA",
              desc: "Chemical purity assays, dissolution profiling, microbial limits, and Certificate of Analysis (CoA) release.",
              icon: <CheckCircle />
            },
            {
              title: "Warehouse & Inventory",
              desc: "Real-time stock ledger, near-expiry clearance filters, and automated low-stock demand generation.",
              icon: <Shield />
            },
            {
              title: "Commercial Sales & Invoicing",
              desc: "Hospital procurement orders, real-time inventory allocation, payment logging, and balance tracking.",
              icon: <BarChart />
            },
            {
              title: "Biometric Face Attendance",
              desc: "Fast anti-spoofing facial recognition with live head-turn, smile, and eye transition verification.",
              icon: <Users />
            },
            {
              title: "Departmental Analytics",
              desc: "Manager operations, leave queues, automated salary calculations, and company-wide audit trails.",
              icon: <Target />
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl"
            >
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-fit p-3 rounded-xl mb-4">
                {item.icon}
              </div>

              <h3 className="text-lg font-bold mb-2 text-white">
                {item.title}
              </h3>

              <p className="text-slate-400 text-xs leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center bg-slate-950/60 border-t border-slate-800">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Ready to Sign In?
        </h2>

        <p className="text-slate-400 mb-6 text-xs md:text-sm">
          Log in with your administrator, manager, or employee credentials.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition shadow-xl"
        >
          Sign In Now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-6 text-center text-slate-500 text-xs border-t border-slate-800">
        © 2026 PharmaSys Enterprise Management System — All Rights Reserved
      </footer>
    </div>
  );
};

export default Home;
