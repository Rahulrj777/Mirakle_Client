// ==== FRONTEND - ProductDetail.jsx (Improved Review Section) ====

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from "../utils/api";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../Redux/cartSlice';
import { axiosWithToken } from '../utils/axiosWithToken';

// Inside ProductDetail component...

const [rating, setRating] = useState(0);
const [comment, setComment] = useState('');
const [error, setError] = useState('');

const userData = JSON.parse(localStorage.getItem("mirakleUser"));
const token = userData?.token;
const user = userData?.user;

const handleSubmitReview = async (e) => {
  e.preventDefault();
  if (!rating || !comment) return setError("Please provide both rating and comment.");
  try {
    await axiosWithToken().post(`/products/${id}/review`, { rating, comment });
    setRating(0);
    setComment('');
    setError('');
    fetchProduct();
  } catch (err) {
    setError(err?.response?.data?.message || "Review failed");
  }
};

{/* ===== Review UI ===== */}
{token ? (
  <form onSubmit={handleSubmitReview} className="space-y-3 mb-6">
    <div>
      <label className="block text-sm font-medium">Your Rating:</label>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
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
    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
      Submit Review
    </button>
  </form>
) : (
  <p className="text-gray-500">Please login to rate & review.</p>
)}

{/* ===== Existing Reviews ===== */}
{product.reviews?.map((r, i) => (
  <div key={i} className="border p-4 rounded mb-3">
    <div className="flex items-center justify-between mb-1">
      <div className="text-yellow-500 text-lg">{'\u2605'.repeat(r.rating)}</div>
      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
    </div>
    <p className="text-gray-800">{r.comment}</p>
    <p className="text-xs text-gray-500 italic mt-1">by {r?.user?.name || r?.user?.email || "Anonymous"}</p>
  </div>
))}

// ==== BACKEND - Express Route for Reviews ====

// routes/products.js
import express from 'express';
import Product from '../models/Product.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /products/:id/review
router.post('/:id/review', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.id;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You already reviewed this product' });
    }

    const newReview = {
      user: userId,
      rating: Number(rating),
      comment,
      createdAt: new Date(),
    };

    product.reviews.push(newReview);
    await product.save();
    res.json({ message: 'Review added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Review submission failed' });
  }
});

// GET /products/all-products (updated to populate reviews)
router.get('/all-products', async (req, res) => {
  try {
    const products = await Product.find().populate('reviews.user', 'name email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Fetching failed' });
  }
});

export default router;

// ==== Mongoose Product Model Update ====

// models/Product.js
const productSchema = new mongoose.Schema({
  // other fields...
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});
