import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";

const AddBatch = () => {
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    manufactureDate: "",
    expiryDate: "",
    productionDemand: ""
  });

  const [products, setProducts] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Products + Demands
  useEffect(() => {
    fetchProducts();
    fetchDemands();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data?.products || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      toast.error("Failed to load products");
      setProducts([]);
    }
  };

  const fetchDemands = async () => {
    try {
      const res = await api.get("/production-demand");
      setDemands(res.data?.demands || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.log(err);
      setDemands([]);
    }
  };

  // Handle Change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.product ||
      !form.quantity ||
      !form.manufactureDate ||
      !form.expiryDate
    ) {
      return toast.error("All fields required");
    }

    if (
      new Date(form.expiryDate) <=
      new Date(form.manufactureDate)
    ) {
      return toast.error(
        "Expiry must be after manufacture date"
      );
    }

    try {
      setLoading(true);

      await api.post("/batch/createBatch", form);

      toast.success("Batch created successfully 🎉");

      setForm({
        product: "",
        quantity: "",
        manufactureDate: "",
        expiryDate: "",
        productionDemand: ""
      });

    } catch (err) {
      console.log(err.response?.data.message ||"error in creating batch");
      toast.error(
        err.response?.data?.message ||
          "Error creating batch"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center items-center min-h-screen bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          ➕ Add New Batch
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Product */}
          <div>
            <label className="text-white text-sm">
              Product
            </label>
            <select
              name="product"
              value={form.product}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
            >
              <option value="">
                Select Product
              </option>

              {products.map((p) => (
                <option
                  key={p._id}
                  value={p._id}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Production Demand */}
          <div>
            <label className="text-white text-sm">
              Production Demand (Optional)
            </label>
            <select
              name="productionDemand"
              value={form.productionDemand}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
            >
              <option value="">
                Select Demand
              </option>

              {demands.map((d) => (
                <option
                  key={d._id}
                  value={d._id}
                >
                  {d.product?.name} - {d.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-white text-sm">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="Enter Quantity"
              value={form.quantity}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
            />
          </div>

          {/* Manufacture Date */}
          <div>
            <label className="text-white text-sm">
              Manufacture Date
            </label>
            <input
              type="date"
              name="manufactureDate"
              value={form.manufactureDate}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-white text-sm">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 text-white outline-none"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg text-white font-semibold"
          >
            {loading
              ? "Creating..."
              : "Create Batch"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddBatch;