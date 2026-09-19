import React from "react";
import { motion } from "framer-motion";
import { Users, Package, Shield, BarChart, CheckCircle, Target } from "lucide-react";
const About = () => {
  return (
    <div className="bg-slate-900 text-white min-h-screen p-6">

      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          About Our ERP System
        </h1>

        <p className="text-slate-400 max-w-2xl mx-auto">
          Our ERP system helps businesses manage production, inventory, sales,
          employees and operations from one central dashboard.
        </p>
      </div>


      {/* Mission Vision */}

      <div className="grid md:grid-cols-2 gap-6 mb-16">

        <div className="bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
          <p className="text-slate-400">
            To simplify business operations using smart automation and
            powerful dashboards.
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
          <p className="text-slate-400">
            To build the most reliable ERP platform for growing businesses.
          </p>
        </div>

      </div>


      {/* Team Section */}

      <h2 className="text-3xl font-bold text-center mb-10">
        Our Team
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mb-20">

        {[1,2,3].map((i) => (

          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-slate-800 p-6 rounded-2xl text-center"
          >

            <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4" />

            <h3 className="font-bold">
              Team Member {i}
            </h3>

            <p className="text-slate-400 text-sm">
              Software Engineer
            </p>

          </motion.div>

        ))}

      </div>


      {/* Why Choose Us */}

      <h2 className="text-3xl font-bold text-center mb-10">
        Why Choose Us
      </h2>

      <div className="grid md:grid-cols-3 gap-6">

        {[
          "Easy to use",
          "Secure system",
          "Real-time analytics",
          "Production workflow",
          "Inventory automation",
          "Modern UI"
        ].map((item, i) => (

          <div
            key={i}
            className="bg-slate-800 p-6 rounded-2xl text-center"
          >
            <CheckCircle className="mx-auto mb-3" />
            <p>{item}</p>
          </div>

        ))}

      </div>


    </div>
  );
};

export default About;
