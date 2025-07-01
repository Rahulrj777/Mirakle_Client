import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from "../utils/api"; 

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const res = await axios.get(`${API_BASE}/api/products/all-products`);
    const found = res.data.find(p => p._id === id);
    if (found) {
      setProduct(found);
      setSelectedImage(found.images?.others?.[0]);
      if (found.variants.length > 0) setSelectedVariant(found.variants[0]);
    }
  };

  const handleSizeClick = (variant) => setSelectedVariant(variant);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || !comment) return setError("Please provide both star and review.");

    try {
      await axios.post(`${API_BASE}/api/products/${id}/review`, 
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(0); setComment('');
      fetchProduct();
    } catch (err) {
      setError(err.response?.data?.message || "Review failed");
    }
  };

  const avgRating = product?.reviews?.length
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
    : 0;

  if (!product || !selectedVariant) return <div className="text-center mt-20">Loading...</div>;

  const price = selectedVariant.price;
  const discount = selectedVariant.discountPercent || 0;
  const finalPrice = (price - (price * discount / 100)).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Preview */}
        <div>
          <img src={`${API_BASE}${selectedImage}`} className="w-full h-[400px] object-contain rounded" />
          <div className="flex gap-2 mt-2">
            {product.images?.others?.map((img, i) => (
              <img key={i} src={`${API_BASE}${img}`}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 object-cover border ${selectedImage === img ? 'border-blue-500' : ''}`} />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>

          <div className="text-yellow-500 my-2">
            {'⭐'.repeat(Math.round(avgRating)) || 'No rating yet'} 
            <span className="text-sm text-gray-600 ml-2">
              ({product.reviews?.length || 0} review{product.reviews?.length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="text-3xl font-bold text-green-600 mb-2">
            ₹{finalPrice}
            {discount > 0 && (
              <>
                <span className="text-gray-400 line-through text-sm ml-3">₹{price}</span>
                <span className="text-sm text-red-500 ml-2">{discount}% OFF</span>
              </>
            )}
          </div>

          <div className="mt-4">
            <p className="font-medium mb-1">Select Size:</p>
            <div className="flex gap-2 flex-wrap">
              {product.variants.map((v, i) => (
                <button key={i}
                  onClick={() => handleSizeClick(v)}
                  className={`px-4 py-1 border rounded-full ${v.size === selectedVariant.size ? 'bg-green-600 text-white' : 'hover:bg-gray-200'}`}>
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button className="bg-orange-500 text-white px-6 py-2 rounded">Add to Cart</button>
            <button className="bg-green-600 text-white px-6 py-2 rounded">Buy Now</button>
          </div>

          <div className="mt-6 text-sm text-gray-800 whitespace-pre-line">{product.description}</div>
        </div>
      </div>

      {/* Product Details Section */}
        <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Product Details</h2>
        {product.details && typeof product.details === 'object' ? (
            <ul className="text-gray-700 text-sm list-disc pl-5">
            {Object.entries(product.details).map(([key, value]) => (
                <li key={key}>
                <strong className="capitalize">{key}</strong>: {value}
                </li>
            ))}
            </ul>
        ) : (
            <p className="text-gray-500 text-sm">No additional info</p>
        )}
        </div>

      {/* Review Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Ratings & Reviews</h2>

        {token ? (
          <form onSubmit={handleSubmitReview} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium">Your Rating:</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="border p-2 rounded"
              >
                <option value="">Select star</option>
                {[1,2,3,4,5].map(star => (
                  <option key={star} value={star}>{star} Star</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Your Review:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full border p-2 rounded"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit Review</button>
          </form>
        ) : (
          <p className="text-gray-500">Please login to rate & review.</p>
        )}

        {/* Existing reviews */}
        {product.reviews?.map((r, i) => (
          <div key={i} className="border p-4 rounded mb-3">
            <div className="text-yellow-500">{'⭐'.repeat(r.rating)}</div>
            <p className="text-gray-800">{r.comment}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;
