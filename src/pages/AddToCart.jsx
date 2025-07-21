import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { incrementQuantity, decrementQuantity, removeFromCart } from "../Redux/cartSlice";
import { useNavigate } from "react-router-dom";
import { axiosWithToken } from "../utils/axiosWithToken";

const AddToCart = () => {
  const { items: cartItems, cartReady } = useSelector((state) => state.cart);
  const { address } = useSelector((state) => state.user || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.currentPrice * item.quantity,
    0
  );

  const originalTotal = cartItems.reduce(
    (acc, item) => acc + item.originalPrice * item.quantity,
    0
  );

  const discountAmount = originalTotal - subtotal;

  if (!cartReady) return <div className="text-center py-10">Loading cart...</div>;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("mirakleUser"))?.user;
    if (user && cartReady) {
      localStorage.setItem(`cart_${user._id}`, JSON.stringify(cartItems));
      axiosWithToken().post('/cart', { items: cartItems }).catch(console.error);
    }
  }, [cartItems, cartReady]);

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Address */}
          <div className="bg-white p-4 rounded shadow flex justify-between items-center">
            {address ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">Deliver to:</p>
                  <p className="text-lg font-semibold">{address.line1}, {address.city} - {address.pincode}</p>
                </div>
                <button onClick={() => navigate("/address")} className="text-blue-600 hover:underline text-sm">
                  Change
                </button>
              </>
            ) : (
              <button onClick={() => navigate("/address")} className="bg-blue-600 text-white px-4 py-2 rounded">
                Add Address
              </button>
            )}
          </div>

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <p className="text-center py-10 text-gray-600">Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item._id} className="bg-white rounded shadow p-4 flex gap-4">
                <img
                  src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-28 h-28 object-cover border rounded"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm text-gray-600">Size: {item.weight}</p>
                  <p className="text-sm text-gray-500 mb-2">Seller: Mirakle</p>

                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold text-xl">₹{item.currentPrice.toFixed(2)}</span>
                    {item.originalPrice > item.currentPrice && (
                      <>
                        <span className="line-through text-sm text-gray-500">₹{item.originalPrice.toFixed(2)}</span>
                        <span className="text-red-500 text-sm font-medium">
                          {Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100)}% Off
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center border rounded">
                      <button className="px-3 py-1 text-lg" onClick={() => dispatch(decrementQuantity(item._id))}>−</button>
                      <span className="px-4">{item.quantity}</span>
                      <button className="px-3 py-1 text-lg" onClick={() => dispatch(incrementQuantity(item._id))}>+</button>
                    </div>
                    <button
                      className="text-red-500 text-sm hover:underline"
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

        {/* Right side: Price Details */}
        <div className="bg-white p-6 rounded shadow h-fit sticky top-28">
          <h3 className="text-xl font-bold mb-4">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span>Price ({cartItems.length} item{cartItems.length > 1 ? "s" : ""})</span>
            <span>₹{originalTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount</span>
            <span className="text-green-600">− ₹{discountAmount.toFixed(2)}</span>
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
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold"
          >
            PLACE ORDER
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCart;
