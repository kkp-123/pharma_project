import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: ""
  });

  //  FETCH
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      console.log("data fetch products", res.data.products);
      setProducts(res.data.products || []);
      setFiltered(res.data.products || []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  //  SEARCH + FILTER
  useEffect(() => {
    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(data);
  }, [search, filter, products]);

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      fetchProducts();
    } catch {
      toast.error("Delete failed");
    }
  };

  //  OPEN EDIT
  const openEdit = (p) => {
    setSelectedProduct(p);
    setForm({
      name: p.name,
      price: p.price,
      stock: p.stock,
      description: p.description
    });
  };

  //  UPDATE
  const handleUpdate = async () => {
  try {
    const data = new FormData();

    data.append("name", form.name);
    data.append("price", form.price);
    data.append("description", form.description);

    if (form.image) {
      data.append("image", form.image);
    }

    await api.put(`/products/${selectedProduct._id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    toast.success("Updated");
    setSelectedProduct(null);
    fetchProducts();

  } catch {
    toast.error("Update failed");
  }
};

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          🛍️ Products
        </h1>

        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-full md:w-64
             bg-white dark:bg-gray-800
             text-gray-900 dark:text-white
             border-gray-300 dark:border-gray-700 outline-none"
        />
      </div>

      {/* FILTER */}
      {/* <div className="flex gap-3 mb-6">
        <button onClick={() => setFilter("ALL")} className="px-3 py-1 bg-gray-500 text-white rounded">
          All
        </button>
        <button onClick={() => setFilter("IN")} className="px-3 py-1 bg-green-500 text-white rounded">
          In Stock
        </button>
        <button onClick={() => setFilter("OUT")} className="px-3 py-1 bg-red-500 text-white rounded">
          Out
        </button>
      </div> */}

      {/* CARDS */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No products</p>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <motion.div
              key={product._id}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 transition-colors"
            >
              {/* IMAGE */}
              <div className="h-40 w-full mb-4 overflow-hidden rounded-xl">
                <img
                  src={
                    product.image
                      ? `http://localhost:3000${product.image}`
                      : "/placeholder.png"
                  }
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* INFO */}
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {product.name}
              </h2>

              <p className="text-sm text-gray-500 line-clamp-2">
                {product.description}
              </p>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-xl font-bold text-indigo-600">
                  ₹{product.price}
                </span>

              </div>

              {/* 🔥 ACTION BUTTONS */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(product)}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* EDIT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 transition-colors">

            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Edit Product
            </h2>

            {/* NAME */}
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Product Name
            </label>
            <input
              placeholder="Enter product name"
              className="w-full mb-3 p-2 border rounded
                   bg-gray-50 dark:bg-gray-700
                   text-gray-900 dark:text-white
                   border-gray-300 dark:border-gray-600"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            {/* PRICE */}
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Price
            </label>
            <input
              type="number"
              placeholder="Enter price"
              className="w-full mb-3 p-2 border rounded
                   bg-gray-50 dark:bg-gray-700
                   text-gray-900 dark:text-white
                   border-gray-300 dark:border-gray-600"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            {/* DESCRIPTION */}
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Description
            </label>
            <textarea
              placeholder="Enter product description"
              className="w-full mb-3 p-2 border rounded
                   bg-gray-50 dark:bg-gray-700
                   text-gray-900 dark:text-white
                   border-gray-300 dark:border-gray-600"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            {/* CURRENT IMAGE */}
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Current Image
            </label>
            <img
              src={
                selectedProduct.image
                  ? `http://localhost:3000${selectedProduct.image}`
                  : "/placeholder.png"
              }
              className="w-full h-32 object-cover rounded mb-3"
            />

            {/* NEW IMAGE */}
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Update Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full mb-4 text-gray-900 dark:text-white"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files[0] })
              }
            />

            {/* BUTTONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Update
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;