import AuditLog from "../models/AuditLog.js";

// GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entity,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (action && action !== "ALL") {
      query.action = action;
    }

    if (entity && entity !== "ALL") {
      query.entity = entity;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { entity: { $regex: search, $options: "i" } }
      ];
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name email department role");

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

