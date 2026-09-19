import User from "../models/User.js";
import Bonus from "../models/Bonus.js";
import { createNotification } from "./notificationController.js";

export const addBonus = async (req, res) => {
  try {
    const { employeeId, amount, month, isForAll } = req.body;

    // For all employees
    if (isForAll) {
      const employees = await User.find({ role: "employee" });
      const managers = await User.find({ role: "manager" });

      const bonusList = employees.map(emp => ({
        employee: emp._id,
        amount,
        month
      }));

      bonusList.push(...managers.map(manager => ({
        employee: manager._id,
        amount,
        month
      })));

      await Bonus.insertMany(bonusList);

      return res.json({ message: "Bonus added for all employees" });
    }

    // Single employee
    const bonus = await Bonus.create({
      employee: employeeId,
      amount,
      month
    });
    await createNotification(
      employeeId,
      `Bonus added for ${month}`,
      "salary"
    );

    res.json(bonus);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* Get All Bonus (Admin) */

export const getAllBonus = async (req, res) => {
  try {

    const { month } = req.query;

    const filter = {};

    if (month) {
      filter.month = month;
    }

    const bonus = await Bonus.find(filter)
      .populate("employee", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bonus
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



/* Get My Bonus (Employee) */

export const getMyBonus = async (req, res) => {

  try {

    const bonus = await Bonus.find({
      employee: req.user._id
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bonus
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};



/*  Mark Bonus Paid */

export const markBonusPaid = async (req, res) => {

  try {

    const bonus = await Bonus.findByIdAndUpdate(
      req.params.id,
      { isPaid: true },
      { new: true }
    );

    res.json(bonus);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};