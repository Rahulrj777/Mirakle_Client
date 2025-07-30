import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
// import your incrementQuantity, decrementQuantity, removeFromCart, etc.

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const mode = location.state?.mode || "cart";

  // Redux cart
  const cartItems = useSelector((state) => state.cart.items || []);
  const cartReady = useSelector((state) => state.cart.cartReady);

  // For simplicity, static shipping
  const SHIPPING = 4;

  // Load product for Buy Now
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

  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
  if (!token) {
    navigate("/login");
    return null;
  }

  if (mode === "cart" && !cartReady) {
    return <div className="text-center mt-20 text-gray-600">Loading your cart...</div>;
  }

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

  // Use buy now product or cart
  const items = mode === "buy-now" ? [product] : cartItems;

  // Total price calculation
  const subtotal = items.reduce((sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1), 0);
  const total = subtotal + SHIPPING;

  // Handler functions (bind these to your Redux actions)
  const handleIncrement = (item) => {
    dispatch({ type: "cart/incrementQuantity", payload: { _id: item._id, variantId: item.variantId } });
  };
  const handleDecrement = (item) => {
    dispatch({ type: "cart/decrementQuantity", payload: { _id: item._id, variantId: item.variantId } });
  };
  const handleRemove = (item) => {
    dispatch({ type: "cart/removeFromCart", payload: { _id: item._id, variantId: item.variantId } });
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-blue-50 py-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-10 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* LEFT: Shopping Cart */}
        <div className="col-span-2 p-8">
          <h2 className="text-2xl font-semibold mb-6">Shopping Cart</h2>
          <div className="space-y-5">
            {items.map((item, idx) => (
              <div className="flex items-center gap-6 p-5 rounded-xl shadow bg-neutral-50 border" key={idx}>
                <img
                  src={item?.images?.others?.[0]?.url || "/placeholder.jpg"}
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover border"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.size && <div className="text-sm text-gray-500 mb-1">Size: {item.size}</div>}
                  <div className="text-green-600 font-semibold">
                    ₹{item.currentPrice} × {item.quantity || 1}
                  </div>
                </div>
                {/* Quantity stepper */}
                <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white shadow-sm">
                  <button className="text-lg px-2" onClick={() => handleDecrement(item)} disabled={item.quantity <= 1}>-</button>
                  <span className="px-2">{item.quantity}</span>
                  <button className="text-lg px-2" onClick={() => handleIncrement(item)}>+</button>
                </div>
                {/* Remove button */}
                <button
                  className="ml-2 px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600"
                  onClick={() => handleRemove(item)}
                  title="Remove from cart"
                >🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Card details and Summary */}
        <div className="p-8 rounded-xl bg-gradient-to-b from-blue-200 via-blue-100 to-blue-50 shadow h-fit">
          <h2 className="text-xl font-semibold mb-8">Card Details</h2>
          <div className="mb-8">
            {/* Card logos */}
            <div className="flex gap-2 mb-4">
              <img src="/visa-logo.png" alt="Visa" className="h-7" />
              <img src="/mastercard-logo.png" alt="MasterCard" className="h-7" />
              <img src="/rupay-logo.png" alt="RuPay" className="h-7" />
              {/* add more as per your assets */}
            </div>
            {/* Card input fields */}
            <input type="text" placeholder="Name on Card" className="w-full py-2 mb-3 px-3 rounded border focus:outline-none" />
            <input type="text" placeholder="Card Number" maxLength={19} className="w-full py-2 mb-3 px-3 rounded border focus:outline-none" />
            <div className="flex gap-3">
              <input type="text" placeholder="MM/YY" className="w-1/2 py-2 px-3 rounded border focus:outline-none" />
              <input type="text" placeholder="CVV" maxLength={4} className="w-1/2 py-2 px-3 rounded border focus:outline-none" />
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Shipping</span>
              <span>₹{SHIPPING}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total (incl. tax)</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
          <button
            className="w-full py-3 rounded bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow"
            onClick={() => alert("Proceeding to payment (not implemented)")}
          >
            ₹{total.toLocaleString()} — Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
