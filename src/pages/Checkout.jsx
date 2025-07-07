import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";
import { useEffect, useState } from "react";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;
  const mode = location.state?.mode;

  const [step, setStep] = useState(1); // 1 = Review, 2 = Payment

  useEffect(() => {
    if (mode === "buy-now") {
      setStep(2); // Directly go to payment
    }
  }, [mode]);

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

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {step === 1 && (
        <div>
          <p className="text-gray-700 mb-4">🛒 You are in cart review step</p>
          <button
            onClick={() => setStep(2)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Proceed to Payment
          </button>
        </div>
      )}

      {step === 2 && mode === "buy-now" && (
        <div className="flex flex-col gap-6">
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

          <div className="text-right">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              onClick={() => alert("Proceeding to payment (not implemented)")}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
