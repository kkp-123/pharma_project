import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const CreateSale = () => {

  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({

    customerName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",

    items: [
      {
        product: "",
        quantity: "",
        price: "",
        discount: 0
      }
    ]

  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products");
      setProducts(data?.products || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.log(error);
      setProducts([]);
    }
  };


  // Handle Items Change

  const handleItemChange = (index, field, value) => {

    const newItems = [...form.items];

    newItems[index][field] = value;

    setForm({
      ...form,
      items: newItems
    });

  };


  // Add Item

  const addItem = () => {

    setForm({
      ...form,
      items: [
        ...form.items,
        {
          product: "",
          quantity: "",
          price: "",
          discount: 0
        }
      ]
    });

  };


  // Remove Item

  const removeItem = (index) => {

    const newItems = form.items.filter(
      (_, i) => i !== index
    );

    setForm({
      ...form,
      items: newItems
    });

  };


  //  Submit

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await api.post("/sales", form);

      toast.success(res.data?.message || "Sale Created Successfully");

      setForm({
        customerName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        items: [{ product: "", quantity: "", price: "", discount: 0 }]
      });

    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating sale");
    } finally {
      setSubmitting(false);
    }
  };


  return (

    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        Create Sale
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-6 rounded-xl space-y-6"
      >

        {/* Customer Info */}

        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <label>Customer Name</label>
            <input
              required
              className="w-full p-2 bg-slate-700 rounded"
              onChange={(e) =>
                setForm({
                  ...form,
                  customerName: e.target.value
                })
              }
            />
          </div>

          <div>
            <label>Company Name</label>
            <input
              className="w-full p-2 bg-slate-700 rounded"
              onChange={(e) =>
                setForm({
                  ...form,
                  companyName: e.target.value
                })
              }
            />
          </div>

          <div>
            <label>Email</label>
            <input
              className="w-full p-2 bg-slate-700 rounded"
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
            />
          </div>

          <div>
            <label>Phone</label>
            <input
              className="w-full p-2 bg-slate-700 rounded"
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value
                })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label>Address</label>
            <textarea
              className="w-full p-2 bg-slate-700 rounded"
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value
                })
              }
            />
          </div>

        </div>


        {/* Items */}

        <div>

          <h2 className="text-lg font-semibold mb-4">
            Products
          </h2>

          {form.items.map((item, index) => (

            <div
              key={index}
              className="grid md:grid-cols-5 gap-3 mb-3 bg-slate-700 p-3 rounded"
            >

              <div>
                <label>Product</label>
                <select
                  className="w-full p-2 bg-slate-800 rounded"
                  onChange={(e) => {
                    const productId = e.target.value;

                    const selectedProduct = products.find(
                      (p) => p._id === productId
                    );

                    setForm((prev) => {
                      const items = [...prev.items];

                      items[index] = {
                        ...items[index],
                        product: productId,
                        price: selectedProduct?.price || 0
                      };

                      return {
                        ...prev,
                        items
                      };
                    });
                  }}
                >
                  <option>Select</option>

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

              <div>
                <label>Qty</label>
                <input
                  type="number"
                  className="w-full p-2 bg-slate-800 rounded"
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "quantity",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>Price</label>
                <input
                  type="number"
                  value={item.price}
                  readOnly
                  className="w-full p-2 bg-slate-800 rounded text-white opacity-80"
                />
              </div>

              <div>
                <label>Discount</label>
                <input
                  type="number"
                  className="w-full p-2 bg-slate-800 rounded"
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "discount",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="flex items-end">

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="bg-red-500 px-3 py-2 rounded"
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

          <button
            type="button"
            onClick={addItem}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            + Add Product
          </button>

        </div>


        {/* Submit */}

        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 w-full py-3 rounded text-lg font-bold transition shadow"
        >
          {submitting ? "Processing Sale..." : "Create Sale"}
        </button>

      </form>

    </div>
  );
};

export default CreateSale;