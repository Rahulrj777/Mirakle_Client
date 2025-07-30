import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux"; // for cart
import { API_BASE } from "../utils/api";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const mode = location.state?.mode || "cart"; // default to cart
  const cartItems = useSelector((state) => state.cart.cartItems || []);

  // ✅ Load product for Buy Now
  useEffect(() => {
    if (mode === "buy-now") {
      const prodFromState = location.state?.product;
      if (prodFromState) {
        setProduct(prodFromState);
        localStorage.setItem("buyNowProduct", JSON.stringify(prodFromState));
      } else {
        const saved = localStorage.getItem("buyNowProduct");
        if (saved) setProduct(JSON.parse(saved));
      }
    }
  }, [location.state, mode]);

  // ✅ Redirect if not logged in
  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
  if (!token) {
    navigate("/login");
    return null;
  }

  // ✅ Handle empty cases
  if (mode === "buy-now" && !product) {
    return (
      <div className="text-center mt-20 text-red-500">
        No product selected. Please go back to the shop.
        <button
          onClick={() => navigate("/", { replace: true })}
          className="block mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Back to Shop
        </button>
      </div>
    );
  }
  if (mode === "cart" && cartItems.length === 0) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Your cart is empty.
        <button
          onClick={() => navigate("/shop")}
          className="block mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  // ✅ Calculate total
  const items = mode === "buy-now" ? [product] : cartItems;
  const total = items.reduce((sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1), 0);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* ✅ Product List */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const imageUrl = item?.images?.others?.[0]?.url || "/placeholder.jpg";
          return (
            <div key={index} className="flex gap-4 border p-4 rounded shadow-sm">
              <img
                src={imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-28 h-28 object-cover rounded"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                {item.size && (
                  <p className="mt-1 text-gray-600">Size: {item.size}</p>
                )}
                <p className="text-green-600 font-bold text-lg mt-2">
                  ₹{item.currentPrice} x {item.quantity || 1}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Summary */}
      <div className="mt-6 text-right border-t pt-4">
        <p className="text-lg font-semibold">
          Total: ₹{total.toLocaleString()}
        </p>
        <button
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer"
          onClick={() => alert("Proceeding to payment (not implemented)")}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default Checkout;
