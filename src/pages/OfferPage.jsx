import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from "../utils/api"; 

const OfferPage = () => {
  const [offerProducts, setOfferProducts] = useState([]);

  useEffect(() => {
    fetchOfferProducts();
  }, []);

  const fetchOfferProducts = async () => {
    try {
      const res = await axios.get('${API_BASE}/api/products/all-products');
      const filtered = res.data.filter((p) => p.discountPercent > 0);
      setOfferProducts(filtered);
    } catch (err) {
      console.error('Failed to fetch offer products:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-red-600">🔥 Offer Products</h1>

      {offerProducts.length === 0 ? (
        <p className="text-center">No offers available now</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {offerProducts.map((product) => {
            const frontImage = product.images?.others?.[0] || '';
            const isOut = product.isOutOfStock;

            return (
              <div
                key={product._id}
                className={`relative border rounded-lg shadow transition ${
                  isOut ? 'opacity-60' : 'hover:shadow-lg'
                }`}
              >
                {/* Discount Badge */}
                {product.discountPercent > 0 && !isOut && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    {product.discountPercent}% OFF
                  </div>
                )}

                {/* Out of Stock */}
                {isOut && (
                  <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full z-10">
                    Out of Stock
                  </div>
                )}

                <img
                  src={`${API_BASE}${frontImage}`}
                  alt={product.title}
                  className={`w-full h-48 object-cover rounded-t-lg ${
                    isOut ? 'grayscale' : ''
                  }`}
                />

                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-1 truncate" title={product.title}>
                    {product.title}
                  </h2>

                  <p className="text-sm text-gray-500 mb-2">
                    {product.weight.value} {product.weight.unit}
                  </p>

                  <div className="mb-3">
                    {product.oldPrice && (
                      <span className="text-gray-400 line-through mr-2">
                        ₹{product.oldPrice}
                      </span>
                    )}
                    <span className="text-green-600 font-bold">
                      ₹{product.currentPrice}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-blue-600 text-white py-1 rounded text-sm disabled:opacity-50"
                      disabled={isOut}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="flex-1 bg-orange-500 text-white py-1 rounded text-sm disabled:opacity-50"
                      disabled={isOut}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OfferPage;
