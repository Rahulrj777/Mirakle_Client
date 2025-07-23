import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const mode = location.state?.mode;

  useEffect(() => {
    const prodFromState = location.state?.product;
    if (mode === "buy-now") {
      if (prodFromState) {
        setProduct(prodFromState);
        localStorage.setItem("buyNowProduct", JSON.stringify(prodFromState));
      } else {
        const saved = localStorage.getItem("buyNowProduct");
        if (saved) {
          setProduct(JSON.parse(saved));
        }
      }
    }
  }, [location.state, mode]);

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
  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
    if (!token) {
      navigate("/login");
      return null;
    }

  const imageUrl =item.images?.others?.[0]?.url || "/placeholder.jpg";

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {product && (
        <div className="flex gap-4">
          <img
            src={imageUrl.url}
            alt={product.title}
            loading="lazy"
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
      )}

      <div className="mt-6 text-right">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer"
          onClick={() => alert("Proceeding to payment (not implemented)")}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default Checkout;
