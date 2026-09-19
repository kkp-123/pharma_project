import { Outlet } from "react-router-dom";
import Navbar from "./src/components/Navbar";

const LayoutPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      
      {/* COMMON NAVBAR */}
      <Navbar />

      {/* PAGE CONTENT */}
      <div>
        <Outlet />
      </div>

    </div>
  );
};

export default LayoutPage;