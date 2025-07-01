import { useSelector, useDispatch } from 'react-redux';
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} from '../Redux/cartSlice';    
import { API_BASE } from "../utils/api"; 

const AddToCart = () => {
  const cartItems = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item._id} className="flex border rounded-lg p-4 items-center gap-4 shadow-sm">
              <img
                src={`${API_BASE}${item.images?.others?.[0]}`}
                alt={item.title}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">
                  {item.weight.value} {item.weight.unit}
                </p>
                <p className="font-bold text-green-600 mt-1">
                  ₹{item.currentPrice} × {item.quantity} = ₹
                  {item.currentPrice * item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="bg-gray-300 px-2 rounded"
                  onClick={() => dispatch(decrementQuantity(item._id))}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="bg-gray-300 px-2 rounded"
                  onClick={() => dispatch(incrementQuantity(item._id))}
                >
                  +
                </button>
              </div>
              <button
                className="ml-4 text-red-600 text-sm"
                onClick={() => dispatch(removeFromCart(item._id))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddToCart;
