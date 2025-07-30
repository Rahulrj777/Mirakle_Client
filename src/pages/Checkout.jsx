import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const mode = location.state?.mode || "cart";

  // Redux cart
  const cartItems = useSelector((state) => state.cart.items || []);
  const cartReady = useSelector((state) => state.cart.cartReady);

  // ✅ Items & Total
let items = [];
  if (mode === "buy-now" && product) {
    items = [
      {
        ...product,
        quantity: product.quantity || 1, // default 1 for buy now
      },
    ];
  } else if (mode === "cart") {
    items = cartItems.filter((item) => !item.isOutOfStock); // optional: hide OOS
  }

  const total = items.reduce(
    (sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1),
    0
  );

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

  // ✅ Show loader while cart is syncing
  if (mode === "cart" && !cartReady) {
    return (
      <div className="text-center mt-20 text-gray-600">Loading your cart...</div>
    );
  }

  // ✅ Handle Buy Now without product
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

  // ✅ Handle empty cart AFTER ready
  if (mode === "cart" && cartReady && cartItems.length === 0) {
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

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product List */}
        <div className="lg:col-span-2 space-y-4">
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
                    ₹{item.currentPrice} × {item.quantity || 1}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Summary */}
        <div className="border p-6 rounded shadow h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Total Items:</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total:</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <button
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 cursor-pointer"
            onClick={() => alert("Proceeding to payment (not implemented)")}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
