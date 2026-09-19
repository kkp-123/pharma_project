import AuditLog from "../models/AuditLog.js";

/**
 * Logs an action to the AuditLog collection
 * @param {Object} req - Express request object (optional)
 * @param {Object} params - Log parameters: { user, userName, userRole, action, entity, entityId, details }
 */
export const logAudit = async (req, params = {}) => {
  try {
    const user = params.user || req?.user?._id || null;
    const userName = params.userName || req?.user?.name || "System";
    const userRole = params.userRole || req?.user?.role || "system";
    
    let ipAddress = "";
    if (req) {
      ipAddress =
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";
    }

    const userAgent = req?.headers ? req.headers["user-agent"] || "" : "";

    await AuditLog.create({
      user,
      userName,
      userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      details: params.details || {},
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  } catch (err) {
    // Non-blocking logger failure
    console.error("Audit log error:", err.message);
  }
};

export default logAudit;

