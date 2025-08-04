import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { API_BASE } from "../utils/api";

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  const mode = location.state?.mode || "cart";
  const cartItems = useSelector((state) => state.cart.items || []);
  const cartReady = useSelector((state) => state.cart.cartReady);
  const selectedAddress = useSelector((state) => state.cart.selectedAddress);
  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;

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
            localStorage.removeItem("buyNowProduct");
            setProduct(null);
          }
        }
      }
    }
  }, [location.state, mode]);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  if (!token) {
    return null; // or a loader if you prefer
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

  const items = mode === "buy-now" ? [product] : cartItems;

  // Calculate subtotal, discount, and total
  const subtotal = items.reduce(
    (sum, item) => sum + (item.originalPrice || item.currentPrice || 0) * (item.quantity || 1),
    0
  );
  const total = items.reduce(
    (sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1),
    0
  );
  const discount = subtotal - total;

  // Quantity controls removed — only show quantity

  const handleRemove = (item) => {
    dispatch({ type: "cart/removeFromCart", payload: { _id: item._id, variantId: item.variantId } });
  };

  // Checkout with Razorpay for UPI
  const handleCheckout = async () => {
    if (paymentMethod !== "upi") {
      alert(`Proceeding with ${paymentMethod.toUpperCase()} payment of ₹${total}`);
      return;
    }

    setLoading(true);

    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
      alert("Razorpay SDK failed to load.");
      setLoading(false);
      return;
    }

    // Create Razorpay order via backend
    const res = await fetch(`${API_BASE}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });
    const orderData = await res.json();

    const options = {
      key: "YOUR_RAZORPAY_KEY", // replace with your Key ID
      amount: orderData.amount,
      currency: "INR",
      name: "Mirakle",
      description: "Order Payment",
      order_id: orderData.id,
      handler: function (response) {
        console.log("Payment Success:", response);
        alert("✅ Payment Successful!");
        navigate("/orders"); // Redirect to orders or success page
      },
      prefill: {
        name: "Customer Name",
        email: "customer@example.com",
        contact: "9876543210",
      },
      theme: { color: "#F97316" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Product List */}
        <div className="space-y-6 h-fit sticky top-20 self-start">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Available Items ({items.length})</h2>
            <div className="space-y-4">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-4 last:border-none last:pb-0"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={
                        item?.images?.others?.[0]?.url ||
                        item?.images?.[0]?.url ||
                        "/placeholder.jpg"
                      }
                      alt={item.title || "Product"}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <div>
                      <h3 className="font-medium">{item.title || "Untitled Product"}</h3>
                      {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="px-4 py-1 text-center font-semibold">
                      Qty: {item.quantity}
                    </div>
                    <div className="text-lg font-semibold">
                      ₹{((item.currentPrice || 0) * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Order Summary + Delivery Address + Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-20 space-y-6">
          {/* Delivery Address */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
            {selectedAddress ? (
              <div className="text-gray-700">
                <p><strong>{selectedAddress.name}</strong></p>
                <p>{selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.pincode}</p>
                <p>Phone: {selectedAddress.phone}</p>
              </div>
            ) : (
              <div className="text-red-500">No delivery address selected.</div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Price ({items.length} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Delivery Charges</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>Total Amount</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="bg-green-50 text-green-700 text-sm mt-3 p-2 rounded">
                  🎉 You saved ₹{discount.toFixed(2)} on this order!
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
            <div className="space-y-3">
              {["upi", "cod", "card", "wallet"].map((method) => (
                <label key={method} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>
                    {method === "upi" && "UPI / Google Pay / PhonePe"}
                    {method === "cod" && "Cash on Delivery (COD)"}
                    {method === "card" && "Credit / Debit Card"}
                    {method === "wallet" && "Wallet / Netbanking"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Checkout Button */}
          <button
            className="w-full py-3 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
