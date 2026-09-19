export const checkDepartment = (...allowedDepartments) => {
  return (req, res, next) => {
    const userDept = req.user.department;

    if (req.user.role === "admin") {
      return next();
    }

    if (!allowedDepartments.includes(userDept)) {
      return res.status(403).json({
        message: "Access denied: Department restricted"
      });
    }

    next();
  };
};