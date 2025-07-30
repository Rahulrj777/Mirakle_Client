import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

const Checkout = () => {
  // All hooks at the top, ALWAYS called
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const mode = location.state?.mode || "cart";

  // Redux state selectors
  const cartItems = useSelector((state) => state.cart.items || []);
  const cartReady = useSelector((state) => state.cart.cartReady);

  // Auth token
  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;

  // Buy now logic
  useEffect(() => {
    if (mode === "buy-now") {
      const prodFromState = location.state?.product;
      if (prodFromState) {
        setProduct(prodFromState);
        localStorage.setItem("buyNowProduct", JSON.stringify(prodFromState));
      } else {
        const saved = localStorage.getItem("buyNowProduct");
        if (saved) {
          try {
            setProduct(JSON.parse(saved));
          } catch {
            localStorage.removeItem("buyNowProduct"); // corrupt? clear
            setProduct(null);
          }
        }
      }
    }
  }, [location.state, mode]);

  // Early returns AFTER hooks
  if (!token) {
    navigate("/login");
    return null;
  }

  if (mode === "cart" && !cartReady) {
    return (
      <div className="text-center mt-20 text-gray-600">Loading your cart...</div>
    );
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

  // Choose which items we're showing
  const items = mode === "buy-now" ? [product] : cartItems;

  // Calculation
  const subtotal = items.reduce(
    (sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1),
    0
  );
  const SHIPPING = 49;
  const total = subtotal + SHIPPING;

  // Handlers (change these to your actual Redux action creators if you use them)
  const handleIncrement = (item) => {
    dispatch({
      type: "cart/incrementQuantity",
      payload: { _id: item._id, variantId: item.variantId }
    });
  };
  const handleDecrement = (item) => {
    dispatch({
      type: "cart/decrementQuantity",
      payload: { _id: item._id, variantId: item.variantId }
    });
  };
  const handleRemove = (item) => {
    dispatch({
      type: "cart/removeFromCart",
      payload: { _id: item._id, variantId: item.variantId }
    });
  };

  return (
    <div className="min-h-screen bg-blue-50 flex justify-center py-12 px-2">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-10 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* LEFT: Product List */}
        <div className="col-span-2 p-8">
          <h2 className="text-2xl font-semibold mb-6">Your Items</h2>
          <div className="space-y-5">
            {items.map((item, i) => (
              <div
                className="flex items-center gap-6 p-5 rounded-xl shadow bg-neutral-50 border"
                key={i}
              >
                <img
                  src={
                    item?.images?.others?.[0]?.url ||
                    item?.images?.[0]?.url ||
                    "/placeholder.jpg"
                  }
                  alt={item.title || "Product Image"}
                  className="w-20 h-20 rounded-lg object-cover border"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title || "Untitled Product"}</h3>
                  {item.size && (
                    <div className="text-sm text-gray-500 mb-1">
                      Size: {item.size}
                    </div>
                  )}
                  <div className="text-green-600 font-semibold">
                    ₹{item.currentPrice ?? "N/A"} × {item.quantity || 1}
                  </div>
                </div>

                {mode === "cart" && (
                  <>
                    <div className="flex items-center space-x-1 border rounded px-2 py-1 bg-white shadow-sm">
                      <button
                        className="text-lg px-2 disabled:opacity-50"
                        onClick={() => handleDecrement(item)}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        className="text-lg px-2"
                        onClick={() => handleIncrement(item)}
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="ml-2 px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600"
                      onClick={() => handleRemove(item)}
                      title="Remove from cart"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Order Summary + Card Details */}
        <div className="p-8 bg-gradient-to-b from-blue-100 via-white to-blue-50 rounded-xl shadow h-fit">
          <h2 className="text-xl font-semibold mb-8">Card Details</h2>
          <div className="mb-8">
            {/* Card logos */}
            <div className="flex gap-2 mb-4">
              <img src="/visa-logo.png" alt="Visa" className="h-7" />
              <img src="/mastercard-logo.png" alt="MC" className="h-7" />
              <img src="/rupay-logo.png" alt="RuPay" className="h-7" />
            </div>
            <input
              type="text"
              placeholder="Name on Card"
              className="w-full py-2 mb-3 px-3 rounded border focus:outline-none"
            />
            <input
              type="text"
              placeholder="Card Number"
              maxLength={19}
              className="w-full py-2 mb-3 px-3 rounded border focus:outline-none"
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                className="w-1/2 py-2 px-3 rounded border focus:outline-none"
              />
              <input
                type="text"
                placeholder="CVV"
                maxLength={4}
                className="w-1/2 py-2 px-3 rounded border focus:outline-none"
              />
            </div>
          </div>
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
