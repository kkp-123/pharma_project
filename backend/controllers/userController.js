import User from "../models/User.js";
import { logAudit } from "../utils/auditLogger.js";

//
// GET ALL USERS (with optional search, filter, pagination)
//
export const getUsers = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      department,
      role,
      isActive,
      faceRegistered
    } = req.query;

    const query = {};

    if (department && department !== "ALL") {
      query.department = department;
    }

    if (role && role !== "ALL") {
      query.role = role;
    }

    if (typeof isActive !== "undefined" && isActive !== "ALL") {
      query.isActive = isActive === "true";
    }

    if (typeof faceRegistered !== "undefined" && faceRegistered !== "ALL") {
      query["faceData.registered"] = faceRegistered === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Check if pagination requested
    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select("-password -faceData.descriptor")
        .populate("manager", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      return res.status(200).json({
        success: true,
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    }

    // Full list without descriptor vector for fast response
    const users = await User.find(query)
      .select("-password -faceData.descriptor")
      .populate("manager", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET SINGLE USER
//
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -faceData.descriptor")
      .populate("manager", "name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({ success: true, user });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// UPDATE USER
//
export const updateUser = async (req, res) => {
  try {
    // Avoid accidentally overwriting faceData descriptor directly through general update
    const updateData = { ...req.body };
    delete updateData.faceData;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true
      }
    ).select("-password -faceData.descriptor");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await logAudit(req, {
      action: "USER_UPDATED",
      entity: "User",
      entityId: user._id,
      details: { updatedFields: Object.keys(updateData), userName: user.name, userEmail: user.email }
    });

    res.json({
      success: true,
      message: "User updated successfully",
      user
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// DELETE USER
//
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await logAudit(req, {
      action: "USER_DELETED",
      entity: "User",
      entityId: user._id,
      details: { userName: user.name, email: user.email, role: user.role }
    });

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET EMPLOYEES BY DEPARTMENT
//
export const getEmployeesByDepartment = async (req, res) => {
  try {
    const department = req.user.role === "admin" && req.query.department
      ? req.query.department
      : req.user.department;

    const employees = await User.find({
      department: department,
      role: "employee",
      isActive: true
    }).select("_id name email department role faceData.registered");

    res.json(employees);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// FACE REGISTRATION & MANAGEMENT CONTROLLERS
// ==========================================

//
// REGISTER / UPDATE EMPLOYEE FACE (Admin or HR manager only)
//
export const saveFaceData = async (req, res) => {
  try {
    const { descriptor } = req.body;
    const userId = req.params.id;

    // Strict validation
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: "Invalid face descriptor vector. Must be an array of 128 floating-point numbers."
      });
    }

    // Ensure all elements are valid numbers
    const isValidNumbers = descriptor.every((val) => typeof val === "number" && !isNaN(val));
    if (!isValidNumbers) {
      return res.status(400).json({
        success: false,
        message: "Descriptor contains invalid numbers."
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    const isUpdate = user.faceData?.registered;
    const now = new Date();

    user.faceData = {
      registered: true,
      descriptor: descriptor,
      registeredAt: user.faceData?.registeredAt || now,
      lastUpdatedAt: now
    };

    await user.save();

    await logAudit(req, {
      action: isUpdate ? "FACE_UPDATED" : "FACE_REGISTERED",
      entity: "User",
      entityId: user._id,
      details: {
        employeeName: user.name,
        employeeEmail: user.email,
        department: user.department
      }
    });

    res.json({
      success: true,
      message: isUpdate
        ? `Face data updated successfully for ${user.name}`
        : `Face registered successfully for ${user.name}`,
      faceData: {
        registered: true,
        registeredAt: user.faceData.registeredAt,
        lastUpdatedAt: user.faceData.lastUpdatedAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// REMOVE EMPLOYEE FACE (Admin or HR manager only)
//
export const removeFaceData = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found."
      });
    }

    user.faceData = {
      registered: false,
      descriptor: [],
      registeredAt: null,
      lastUpdatedAt: new Date()
    };

    await user.save();

    await logAudit(req, {
      action: "FACE_REMOVED",
      entity: "User",
      entityId: user._id,
      details: {
        employeeName: user.name,
        employeeEmail: user.email
      }
    });

    res.json({
      success: true,
      message: `Face registration removed for ${user.name}. Face attendance is now disabled for this user.`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET FACE REGISTRATION STATUS (Public info for self / admin)
//
export const getFaceStatus = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    const user = await User.findById(userId).select("name email department role faceData.registered faceData.registeredAt faceData.lastUpdatedAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      faceData: {
        registered: !!user.faceData?.registered,
        registeredAt: user.faceData?.registeredAt || null,
        lastUpdatedAt: user.faceData?.lastUpdatedAt || null
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//
// GET FACE DESCRIPTOR (For attendance verification matching)
//
export const getFaceDescriptor = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    // Check authorization: User can only fetch their own descriptor, unless Admin or HR Manager
    const isSelf = String(req.user._id) === String(userId);
    const isAdmin = req.user.role === "admin";
    const isHRManager = req.user.role === "manager" && req.user.department === "HR";

    if (!isSelf && !isAdmin && !isHRManager) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access face descriptor of another user."
      });
    }

    const user = await User.findById(userId).select("name email faceData");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.faceData?.registered || !user.faceData?.descriptor?.length) {
      return res.status(404).json({
        success: false,
        message: "Face is not registered for this employee. Please register face first."
      });
    }

    res.json({
      success: true,
      descriptor: user.faceData.descriptor,
      registeredAt: user.faceData.registeredAt
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};