import Holiday from "../models/Holiday.js";

export const addHoliday = async (req, res) => {
  try {
    const { date, name } = req.body;

    if (!date || !name) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await Holiday.findOne({ date });
    if (exists) {
      return res.status(400).json({ message: "Holiday already exists" });
    }

    const holiday = await Holiday.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.json(holiday);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHolidays = async (req, res) => {
  try {
    const data = await Holiday.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: "Holiday removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};