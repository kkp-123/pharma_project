import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";

const AdminCreateProduct = () => {
  const [form, setForm] = useState({
    name: "",
    type: "Tablet",
    price: "",
    description: ""
  });

  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.type) {
      return toast.error("Name & Type required");
    }

    try {
      const data = new FormData();

      data.append("name", form.name);
      data.append("type", form.type);
      data.append("price", form.price);
      data.append("description", form.description);

      if (image) {
        data.append("image", image); // 
      }

      await api.post("/products/create", data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Product created 🚀");

      setForm({
        name: "",
        type: "Tablet",
        price: "",
        description: ""
      });
      setImage(null);

    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating product");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-purple-900 via-gray-900 to-indigo-900 p-4">

      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl 
        p-8 rounded-2xl shadow-2xl border border-white/20"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Add Product
        </h2>

        {/* NAME */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white"
        />

        {/* TYPE */}
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white outline-none"
        >
          <option value="Tablet" className="bg-slate-900 text-white">Tablet</option>
          <option value="Capsule" className="bg-slate-900 text-white">Capsule</option>
          <option value="Syrup" className="bg-slate-900 text-white">Syrup</option>
          <option value="Injection" className="bg-slate-900 text-white">Injection</option>
          <option value="Ointment" className="bg-slate-900 text-white">Ointment</option>
        </select>

        {/* PRICE */}
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white"
        />

        {/* IMAGE UPLOAD */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full mb-4 p-3 bg-white/20 text-white"
        />

        {/* DESCRIPTION */}
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full mb-6 p-3 rounded-lg bg-white/20 text-white"
        />

        {/* BUTTON */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 
          p-3 rounded-lg text-white font-semibold"
        >
          Create Product
        </button>
      </motion.form>
    </div>
  );
};

export default AdminCreateProduct;