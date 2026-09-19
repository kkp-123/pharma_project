import Task from "../models/Task.js";
import User from "../models/User.js";
import sendNotification from "../utils/sendNotification.js";


// CREATE TASK (Manager only, department restricted)
export const createTask = async (req, res) => {
  try {
    const { title, description, employee, department, dueDate } = req.body;

    const managerDept = req.user.department;

    // Validate employee department
    if (employee) {
      const emp = await User.findById(employee);

      if (!emp) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (emp.department !== managerDept) {
        return res.status(403).json({
          message: "You can assign tasks only to your department employees"
        });
      }
    }

    //Validate department
    if (department && department !== managerDept) {
      return res.status(403).json({
        message: "You can assign tasks only to your department"
      });
    }

    const task = await Task.create({
      title,
      description,
      employee,
      department: department || managerDept,
      dueDate,
      manager: req.user._id
    });
    await sendNotification({
      user: employee,
      message: `New task assigned: ${title}`,
      type: "task"
    });

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//GET MANAGER TASKS
export const getManagerTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ manager: req.user._id })
      .populate("employee", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//GET EMPLOYEE TASKS
export const getEmployeeTasks = async (req, res) => {
  try {

    const tasks = await Task.find({
      employee: req.user._id   // ✅ only logged-in employee tasks
    })
    .populate("manager", "name")
    .sort({ createdAt: -1 });

    res.json(tasks);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// UPDATE TASK (Manager can edit)
export const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, employee } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    //Only manager who created
    if (task.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    //Validate employee department again
    if (employee) {
      const emp = await User.findById(employee);

      if (emp.department !== req.user.department) {
        return res.status(403).json({
          message: "Cannot assign outside your department"
        });
      }

      task.employee = employee;
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;

    await task.save();

    

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//UPDATE PROGRESS (Employee only)
export const updateTaskProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    //Only assigned employee
    if (!task.employee || task.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    task.progress = progress;

    // Auto status logic
    if (progress > 0 && progress < 100) {
      task.status = "in-progress";
    }

    if (progress === 100) {
      task.status = "completed";
    }

    //Save history
    task.progressHistory.push({ value: progress });

    await task.save();
    // await sendNotification({
    //   user: task.manager,
    //   message: `Progress updated to ${progress}%`,
    //   type: "task"
    // });

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ADD COMMENT (Employee + Manager)
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.comments.push({
      user: req.user._id,
      text
    });

    await task.save();

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};