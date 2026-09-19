import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAudit } from "../utils/auditLogger.js";

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

//
// REGISTER (Admin creates user)
//
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "employee",
      department,
      manager,
      salary = 0,
      phone,
      address,
      joiningDate
    } = req.body;

    // Prevent creating admin (optional safety)
    if (role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot create admin account through this form." });
    }

    if (role === "employee") {
      if (!manager) {
        return res.status(400).json({ success: false, message: "Manager is required for employee" });
      }

      // Check manager exists
      const managerData = await User.findById(manager);

      if (!managerData) {
        return res.status(404).json({ success: false, message: "Selected manager not found" });
      }

      if (managerData.department !== department) {
        return res.status(400).json({
          success: false,
          message: "Manager must be from the same department"
        });
      }
    }

    // Check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      manager: role === "employee" ? manager : null,
      salary: Number(salary) || 0,
      phone: phone || "",
      address: address || "",
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      faceData: {
        registered: false,
        descriptor: [],
        registeredAt: null,
        lastUpdatedAt: null
      }
    });

    await logAudit(req, {
      action: "USER_CREATED",
      entity: "User",
      entityId: user._id,
      details: {
        userName: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.faceData?.descriptor;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userObj
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// LOGIN (All users)
//
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact admin."
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    await logAudit(null, {
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: "LOGIN",
      entity: "User",
      entityId: user._id,
      details: { email: user.email, department: user.department }
    });

    // Send response
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      faceRegistered: !!user.faceData?.registered,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// GET ALL MANAGERS
//
export const getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: "manager", isActive: true })
      .select("_id name email department");

    res.json(managers);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};