import Location from "../models/Location.js";


// GET ACTIVE LOCATION (for normal users)
export const getLocation = async (req, res) => {
  try {
    const location = await Location.findOne({ isActive: true });
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET ALL LOCATIONS (ADMIN UI)
export const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// CREATE LOCATION (AUTO-DEACTIVATE OLD ACTIVE)
export const setLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius, name } = req.body;

    await Location.updateMany({}, { isActive: false });

    const location = await Location.create({
      name,
      latitude,
      longitude,
      radius,
      isActive: true
    });

    res.json({ success: true, location });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE LOCATION
export const updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, location });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DEACTIVATE LOCATION
export const deactivateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: "Location deactivated",
      location
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ACTIVATE LOCATION (optional but useful)
export const activateLocation = async (req, res) => {
  try {
    // deactivate all first
    await Location.updateMany({}, { isActive: false });

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    res.json({
      success: true,
      message: "Location activated",
      location
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};