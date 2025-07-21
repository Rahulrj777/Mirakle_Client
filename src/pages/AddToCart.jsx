import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} from "../Redux/cartSlice";
import { useNavigate } from "react-router-dom";
import { axiosWithToken } from '../utils/axiosWithToken';

const AddToCart = () => {
  const { items: cartItems, cartReady } = useSelector((state) => state.cart);
  const { address } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.currentPrice * item.quantity,
    0
  );

  if (!cartReady) return <div className="text-center py-10">Loading cart...</div>;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("mirakleUser"))?.user;
    if (user && cartReady) {
      localStorage.setItem(`cart_${user._id}`, JSON.stringify(cartItems));
      axiosWithToken().post('/cart', { items: cartItems }).catch(console.error);
    }
  }, [cartItems, cartReady]);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
    if (!token) return;

    const sync = setTimeout(() => {
      if (cartItems.length > 0) {
        axiosWithToken()
          .post('/cart', { items: cartItems })
          .then(() => console.log("✅ Synced cart"))
          .catch(err => console.error("❌ Sync failed", err));
      }
    }, 500);

    return () => clearTimeout(sync);
  }, [cartItems]);

  return (
    <div className="bg-gray-100 py-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold mb-2">Shopping Cart</h2>

          {/* Address Section */}
          <div className="bg-white p-4 rounded shadow mb-4">
            {address ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Deliver to:</p>
                  <p className="text-lg">{address.city} - {address.pincode}</p>
                </div>
                <button
                  onClick={() => navigate("/address")}
                  className="text-blue-600 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/address")}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Add Address
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div
                key={item._id}
                className="bg-white p-4 rounded shadow flex flex-col md:flex-row gap-4 items-center"
              >
                <img
                  src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-28 h-28 object-cover rounded border"
                />

                <div className="flex-1 w-full">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Size: {item.weight.value} {item.weight.unit}
                  </p>
                  <p className="text-sm text-gray-500">Seller: YourShop</p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-green-600 font-bold text-xl">
                      ₹{item.currentPrice}
                    </span>
                    <span className="text-sm text-gray-500">
                      × {item.quantity} = ₹
                      {(item.currentPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center mt-3 gap-4">
                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        className="px-3 py-1 text-lg cursor-pointer"
                        onClick={() => dispatch(decrementQuantity(item._id))}
                      >
                        −
                      </button>
                      <span className="px-3 py-1">{item.quantity}</span>
                      <button
                        className="px-3 py-1 text-lg cursor-pointer"
                        onClick={() => dispatch(incrementQuantity(item._id))}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-red-500 text-sm hover:underline cursor-pointer"
                      onClick={() => dispatch(removeFromCart(item._id))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="bg-white p-6 rounded shadow h-fit sticky top-30">
          <h3 className="text-xl font-semibold mb-4">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span>Price ({cartItems.length} item{cartItems.length > 1 ? "s" : ""})</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount</span>
            <span className="text-green-600">− ₹0</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Delivery Charges</span>
            <span className="text-green-600">Free</span>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full  cursor-pointer bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold"
          >
            PLACE ORDER
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCart;
