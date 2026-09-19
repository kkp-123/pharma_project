import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "react-hot-toast";
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'

import LayoutPage from '../Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Login from './pages/Login.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import AdminDashboard from './pages/Admin Department/AdminDashboard.jsx'
import EmployeeDashboard from './pages/Employee/EmployeeDashboard.jsx'
import AdminCreateProduct from './pages/Admin Department/AdminCreateProducts.jsx'
import ProductList from './pages/Admin Department/AllProducts.jsx'
import InventoryDashboard from './pages/Inventory Department/Inventory.jsx'
import AdminCreateUser from './pages/Admin Department/AdminCreateUser.jsx'
import UserManagement from './pages/Admin Department/UserManagement.jsx'
import AdminSalaryDashboard from './pages/Admin Department/AdminSalaryDashboard.jsx'
import AdminAttendanceDashboard from './pages/Admin Department/AdminAttendenceDashboard.jsx'
import AuditLogs from './pages/Admin Department/AuditLogs.jsx'
import AddBatch from './pages/Production Department/AddBatch.jsx'
import QCPage from './pages/QC Department/QCPage.jsx'
import HolidayManagement from './pages/Admin Department/HolidayManagement.jsx'
import ManagerLeaves from './pages/Manager/ManagerLeaves.jsx'
import ManagerTasks from './pages/Manager/ManagerTasks.jsx'
import MySalaryDashboard from './pages/MySalaryDashboard.jsx'
import EmployeeTasks from './pages/Employee/EmployeeTasks.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import ManagerDashboard2 from './pages/Manager/ManagerDashBoard2.jsx';
import SalesDashboard from './pages/Sales Department/SalesDashboard.jsx';
import CreateSale from './pages/Sales Department/SalesCreatePage.jsx';
import SalesOrders from './pages/Sales Department/SalesOrders.jsx';
import SalesOrderDetails from './pages/Sales Department/SalesOrderDetailPage.jsx';
import ProductionDemand from './pages/Production Department/ProductionDemand.jsx';
import LocationSettings from './pages/Admin Department/LocationSetting.jsx';
import MyAttendance from './pages/MyAttendancePage.jsx';
import MyProductionTasks from './pages/Production Department/EmployeeProduction.jsx';
import ProductionRequest from './pages/Production Department/ProductionRequest.jsx';
import DepartmentAttendancePage from './pages/Manager/DepartmentAttendancePage.jsx';
import QCHistory from './pages/QC Department/QCHistory.jsx';
import MyLeaves from './pages/Employee/MyLeaves.jsx';
import AddBonus from './pages/Admin Department/AddBonus.jsx';
import BonusHistory from './pages/Admin Department/BonusHistory.jsx';
import MyBonus from './pages/Employee/MyBonus.jsx';
import SalesPayments from './pages/Sales Department/SalesPayment.jsx';
import FaceTest from './pages/FaceTest.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={<LayoutPage />}>
        <Route path="" element={<Home />}></Route>
        <Route path="about" element={<About />}></Route>
        <Route path='facetest' element={<FaceTest/>}></Route>
        <Route path='login' element={<Login />}></Route>

        {/* Dashboards with Protected Layout */}
        <Route path='dashboard/' element={<DashboardLayout />}>
          <Route path='myBonus' element={<MyBonus/>}></Route>
          <Route path="production-demand" element={<ProductionDemand />} />
          <Route path="employeeProduction" element={<MyProductionTasks/>}></Route>
          <Route path="productionRequests" element={<ProductionRequest/>}></Route>
          <Route path="myAttendance" element={<MyAttendance/>}></Route>
          <Route path="profile" element={<ProfilePage />}></Route>

          {/* Sales Sub-routes */}
          <Route path="sales/">
            <Route path="" element={<SalesDashboard/>}></Route>
            <Route path="create" element={<CreateSale/>}></Route>
            <Route path="orders" element={<SalesOrders/>}></Route>
            <Route path=":id" element={<SalesOrderDetails/>}></Route>
            <Route path="payments" element={<SalesPayments/>}></Route>
          </Route>

          {/* Admin Role Protected Routes */}
          <Route path='admin/' element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>}></Route>
          <Route path='admin/'>
            <Route path='adminCreateProduct' element={<ProtectedRoute allowedRoles={["admin"]}><AdminCreateProduct /></ProtectedRoute>}></Route>
            <Route path="allProducts" element={<ProtectedRoute allowedRoles={["admin"]}><ProductList /></ProtectedRoute>}></Route>
            <Route path='inventory' element={<ProtectedRoute allowedRoles={["admin"]}><InventoryDashboard /></ProtectedRoute>}></Route>
            <Route path='signup' element={<ProtectedRoute allowedRoles={["admin"]}><AdminCreateUser /></ProtectedRoute>}></Route>
            <Route path="userManagement" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>}></Route>
            <Route path="salaryDashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSalaryDashboard /></ProtectedRoute>}></Route>
            <Route path="attendanceDashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAttendanceDashboard /></ProtectedRoute>}></Route>
            <Route path="locationSettings" element={<ProtectedRoute allowedRoles={["admin"]}><LocationSettings /></ProtectedRoute>}></Route>
            <Route path="auditLogs" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLogs /></ProtectedRoute>}></Route>
            <Route path='addBonus' element={<ProtectedRoute allowedRoles={["admin"]}><AddBonus/></ProtectedRoute>}></Route>
            <Route path='bonusHistory' element={<ProtectedRoute allowedRoles={["admin"]}><BonusHistory/></ProtectedRoute>}></Route>
          </Route>

          {/* Manager Role Protected Routes */}
          <Route path="manager/" element={<ProtectedRoute allowedRoles={["manager", "admin"]}><ManagerDashboard2 /></ProtectedRoute>}></Route>
          <Route path="manager/">
            <Route path="addBatch" element={<ProtectedRoute allowedRoles={["manager", "admin"]}><AddBatch /></ProtectedRoute>}></Route>
            <Route path="QC" element={<ProtectedRoute allowedRoles={["manager", "admin"]}><QCPage /></ProtectedRoute>}></Route>
            <Route path="holidayManagement" element={<ProtectedRoute allowedRoles={["manager", "admin"]}><HolidayManagement /></ProtectedRoute>}></Route>
            <Route path='managerLeaves' element={<ProtectedRoute allowedRoles={["manager", "admin"]}><ManagerLeaves /></ProtectedRoute>}></Route>
            <Route path='taskManagement' element={<ProtectedRoute allowedRoles={["manager", "admin"]}><ManagerTasks /></ProtectedRoute>}></Route>
            <Route path="mySalary" element={<ProtectedRoute allowedRoles={["manager", "admin"]}><MySalaryDashboard /></ProtectedRoute>} ></Route>
            <Route path='departmentAttendance' element={<ProtectedRoute allowedRoles={["manager", "admin"]}><DepartmentAttendancePage/></ProtectedRoute>}></Route>
            <Route path='qcHistory' element={<ProtectedRoute allowedRoles={["manager", "admin"]}><QCHistory/></ProtectedRoute>}></Route>
          </Route>

          {/* Employee Role Protected Routes */}
          <Route path="employee/" element={<ProtectedRoute allowedRoles={["employee", "manager", "admin"]}><EmployeeDashboard /></ProtectedRoute>}></Route>
          <Route path='employee/'>
            <Route path="tasks" element={<ProtectedRoute allowedRoles={["employee", "manager", "admin"]}><EmployeeTasks /></ProtectedRoute>}></Route>
            <Route path="myLeaves" element={<ProtectedRoute allowedRoles={["employee", "manager", "admin"]}><MyLeaves/></ProtectedRoute>}></Route>
            <Route path="mySalary" element={<ProtectedRoute allowedRoles={["employee", "manager", "admin"]}><MySalaryDashboard /></ProtectedRoute>} ></Route>
          </Route>
        </Route>
      </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          zIndex: 9999,
        },
      }}
    />
    <RouterProvider router={router} />
  </AuthProvider>
)