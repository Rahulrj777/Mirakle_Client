import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";

const Checkout = () => {
  const location = useLocation();
  const product = location.state?.product;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="flex gap-4">
        <img
          src={`${API_BASE}${product.images?.others?.[0] || ""}`}
          alt={product.title}
          className="w-40 h-40 object-cover rounded"
        />
        <div>
          <h2 className="text-xl font-semibold">{product.title}</h2>
          <p className="mt-2 text-gray-600">
            Weight: {product.weight?.value} {product.weight?.unit}
          </p>
          <p className="text-green-600 font-bold text-xl mt-2">
            ₹{product.currentPrice}
          </p>
        </div>
      </div>

      <div className="mt-6 text-right">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          onClick={() => alert("Proceeding to payment (not implemented)")}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default Checkout;
