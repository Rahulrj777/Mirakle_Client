import { useSelector, useDispatch } from 'react-redux';
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} from '../Redux/cartSlice';
import { API_BASE } from "../utils/api";
import { useNavigate } from "react-router-dom";

const AddToCart = () => {
  const cartItems = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.currentPrice * item.quantity,
    0
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">🛒 Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-600">Your cart is empty.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Items */}
          <div className="md:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="flex flex-col sm:flex-row border rounded-lg shadow-md p-4 gap-4 bg-white"
              >
                <img
                  src={`${API_BASE}${item.images?.others?.[0]}`}
                  alt={item.title}
                  className="w-full sm:w-32 h-32 object-cover rounded-lg"
                />

                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">
                    {item.weight.value} {item.weight.unit}
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-green-600 font-bold">
                      ₹{item.currentPrice}
                    </span>
                    <span className="text-sm text-gray-500">
                      × {item.quantity} = ₹{(item.currentPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      className="bg-gray-200 px-3 py-1 rounded text-lg"
                      onClick={() => dispatch(decrementQuantity(item._id))}
                    >
                      −
                    </button>
                    <span className="text-lg font-medium">{item.quantity}</span>
                    <button
                      className="bg-gray-200 px-3 py-1 rounded text-lg"
                      onClick={() => dispatch(incrementQuantity(item._id))}
                    >
                      +
                    </button>
                    <button
                      className="text-red-500 text-sm ml-auto"
                      onClick={() => dispatch(removeFromCart(item._id))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Summary */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md h-fit sticky top-20">
            <h3 className="text-xl font-bold mb-4">Cart Summary</h3>
            <div className="flex justify-between text-gray-700 mb-2">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <button
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToCart;
