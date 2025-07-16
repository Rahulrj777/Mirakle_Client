import { useSelector, useDispatch } from 'react-redux';
import { incrementQuantity, decrementQuantity, removeFromCart } from '../Redux/cartSlice';
import { API_BASE } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const CartPage = () => {
  <Header/>
  const cartItems = useSelector((state) => state.cart.items) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.currentPrice * item.quantity,
    0
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item._id} className="flex items-center border rounded-lg p-4 gap-4 shadow-sm">
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
                    {(item.currentPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="bg-gray-300 px-3 rounded text-lg"
                    onClick={() => dispatch(decrementQuantity(item._id))}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="bg-gray-300 px-3 rounded text-lg"
                    onClick={() => dispatch(incrementQuantity(item._id))}
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-red-500 text-sm ml-4"
                  onClick={() => dispatch(removeFromCart(item._id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="mt-10 border-t pt-6">
            <h3 className="text-xl font-bold mb-2">Subtotal: ₹{subtotal.toFixed(2)}</h3>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
