import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const LocationSettings = () => {

  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: 100
  });

  const [locations, setLocations] = useState([]);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [editingId, setEditingId] = useState(null);


  useEffect(() => {
    fetchLocations();
  }, []);


  const fetchLocations = async () => {
    try {
      const res = await api.get("/location/all");
      setLocations(Array.isArray(res.data) ? res.data : (res.data?.locations || []));
    } catch (err) {
      toast.error("Failed to load locations");
      setLocations([]);
    }
  };


  // GPS FETCH
  const getCurrentLocation = () => {

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setLoadingGPS(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {

        const { latitude, longitude } = position.coords;

        setForm((prev) => ({
          ...prev,
          latitude,
          longitude
        }));

        toast.success("Location fetched");
        setLoadingGPS(false);
      },
      () => {
        toast.error("Failed to get location");
        setLoadingGPS(false);
      }
    );
  };


  // SAVE (CREATE OR UPDATE)
  const saveLocation = async () => {
    try {

      if (editingId) {
        await api.put(`/location/${editingId}`, form);
        toast.success("Location updated");
      } else {
        await api.post("/location", form);
        toast.success("Location created");
      }

      setForm({
        name: "",
        latitude: "",
        longitude: "",
        radius: 100
      });

      setEditingId(null);
      fetchLocations();

    } catch (err) {
      toast.error("Failed to save");
    }
  };


  // EDIT
  const handleEdit = (loc) => {
    setForm({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius
    });
    setEditingId(loc._id);
  };


  // DEACTIVATE
  const deactivate = async (id) => {
    try {
      await api.patch(`/location/deactivate/${id}`);
      toast.success("Deactivated");
      fetchLocations();
    } catch {
      toast.error("Failed");
    }
  };


  // ACTIVATE
  const activate = async (id) => {
    try {
      await api.patch(`/location/activate/${id}`);
      toast.success("Activated");
      fetchLocations();
    } catch {
      toast.error("Failed");
    }
  };


  return (
    <div className="p-6 bg-gray-900 text-white">

      <h2 className="text-xl mb-4 font-bold">
        Office Location Management
      </h2>


      {/* FORM */}
      <div className="bg-gray-800 p-4 rounded mb-6">

        <input
          placeholder="Name"
          className="p-2 bg-gray-700 block mb-2 w-full"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Latitude"
          className="p-2 bg-gray-700 block mb-2 w-full"
          value={form.latitude}
          onChange={(e) =>
            setForm({ ...form, latitude: e.target.value })
          }
        />

        <input
          placeholder="Longitude"
          className="p-2 bg-gray-700 block mb-2 w-full"
          value={form.longitude}
          onChange={(e) =>
            setForm({ ...form, longitude: e.target.value })
          }
        />

        <input
          placeholder="Radius"
          className="p-2 bg-gray-700 block mb-2 w-full"
          value={form.radius}
          onChange={(e) =>
            setForm({ ...form, radius: e.target.value })
          }
        />


        <div className="flex gap-3 mt-3">

          <button
            onClick={getCurrentLocation}
            className="bg-green-600 px-4 py-2 rounded"
          >
            {loadingGPS ? "Getting..." : "Use GPS"}
          </button>

          <button
            onClick={saveLocation}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            {editingId ? "Update" : "Save"}
          </button>

        </div>

      </div>


      {/* LIST */}
      <div className="space-y-3">

        {locations.map((loc) => (
          <div
            key={loc._id}
            className="bg-gray-800 p-4 rounded flex justify-between items-center"
          >

            <div>
              <div className="font-semibold">
                {loc.name}
              </div>

              <div className="text-sm text-gray-400">
                {loc.latitude}, {loc.longitude} — {loc.radius}m
              </div>

              <div className="text-xs mt-1">
                Status:
                <span className={loc.isActive ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                  {loc.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>


            {/* ACTIONS */}
            <div className="flex gap-2">

              <button
                onClick={() => handleEdit(loc)}
                className="bg-yellow-500 px-3 py-1 rounded"
              >
                Edit
              </button>

              {loc.isActive ? (
                <button
                  onClick={() => deactivate(loc._id)}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => activate(loc._id)}
                  className="bg-green-600 px-3 py-1 rounded"
                >
                  Activate
                </button>
              )}

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default LocationSettings;