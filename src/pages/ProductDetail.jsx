"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { useDispatch, useSelector } from "react-redux"
import { addToCart, setCartItem } from "../Redux/cartSlice"
import { safeApiCall } from "../utils/axiosWithToken"

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage] = useState("")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // ✅ Safe user data access
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))
    } catch {
      return null
    }
  }, [])

  // ✅ Safe cart selector with memoization
  const cartItems = useSelector((state) => {
    const items = state.cart?.items
    return Array.isArray(items) ? items : []
  })

  const token = user?.token

  // ✅ Memoized fetch functions with better error handling
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      const found = res.data.find((p) => p._id === id)

      if (found) {
        setProduct(found)
        setSelectedImage(found.images?.others?.[0] || "")

        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0])
        }

        // Handle existing review
        if (found.reviews?.length > 0 && user?.user) {
          const existing = found.reviews.find((r) => r.user === user.user.userId || r.user === user.user._id)
          if (existing) {
            setRating(existing.rating)
            setComment(existing.comment)
          }
        }
      } else {
        setError("Product not found")
      }
    } catch (err) {
      console.error("Error fetching product:", err)
      setError("Failed to load product")
    } finally {
      setLoading(false)
    }
  }, [id, user])

  const fetchRelated = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/related/${id}`)
      setRelatedProducts(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Failed to fetch related products", err)
      setRelatedProducts([])
    }
  }, [id])

  // ✅ Load cart safely without causing re-renders
  const loadCartSafely = useCallback(async () => {
    if (!token || cartItems.length > 0) return

    const cartData = await safeApiCall(async (api) => await api.get("/cart"), { items: [] })

    if (cartData && Array.isArray(cartData.items)) {
      dispatch(setCartItem(cartData.items))
    } else if (Array.isArray(cartData)) {
      dispatch(setCartItem(cartData))
    } else {
      dispatch(setCartItem([]))
    }
  }, [token, cartItems.length, dispatch])

  // ✅ Effects with proper dependencies
  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchRelated()
    }
  }, [id, fetchProduct, fetchRelated])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [id])

  useEffect(() => {
    loadCartSafely()
  }, [loadCartSafely])

  // ✅ Memoized handlers
  const handleSizeClick = useCallback((variant) => {
    setSelectedVariant(variant)
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!rating || !comment.trim()) {
        setError("Please provide both rating and review.")
        return
      }

      const result = await safeApiCall(
        async (api) =>
          await api.post(`/products/${id}/review`, {
            rating,
            comment: comment.trim(),
          }),
      )

      if (result) {
        setRating(0)
        setComment("")
        setError("")
        fetchProduct()
      } else {
        setError("Review submission failed")
      }
    },
    [rating, comment, id, fetchProduct],
  )

  const handleAddToCart = useCallback(
    async (product) => {
      if (addingToCart) return

      if (!user?.token) {
        alert("Please login to add items to cart")
        navigate("/login_signup")
        return
      }

      if (!selectedVariant) {
        alert("Please select a variant")
        return
      }

      setAddingToCart(true)

      const productToAdd = {
        _id: product._id,
        title: product.title,
        images: product.images,
        variantId: selectedVariant._id,
        size: selectedVariant.size || `${selectedVariant.weight?.value} ${selectedVariant.weight?.unit}`,
        weight: {
          value: selectedVariant?.weight?.value || selectedVariant?.size,
          unit: selectedVariant?.weight?.unit || (selectedVariant?.size ? "size" : "unit"),
        },
        currentPrice: Number.parseFloat(finalPrice),
        quantity: 1,
      }

      try {
        // Add to Redux first for immediate UI feedback
        dispatch(addToCart(productToAdd))

        // Try to sync to backend
        const syncResult = await safeApiCall(async (api) => await api.post("/cart/add", { item: productToAdd }))

        if (syncResult) {
          console.log("✅ Cart synced to backend")
        } else {
          console.warn("⚠️ Backend sync failed, but item added to local cart")
        }

        alert("Product added to cart successfully!")
      } catch (err) {
        console.error("❌ Add to cart failed:", err)
        alert("Something went wrong while adding to cart")
      } finally {
        setAddingToCart(false)
      }
    },
    [addingToCart, user, selectedVariant, navigate, dispatch],
  )

  // ✅ Memoized calculations
  const avgRating = useMemo(() => {
    if (!product?.reviews?.length) return 0
    return (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
  }, [product?.reviews])

  const finalPrice = useMemo(() => {
    if (!selectedVariant) return "0.00"
    const price = selectedVariant.price
    const discount = selectedVariant.discountPercent || 0
    return (price - (price * discount) / 100).toFixed(2)
  }, [selectedVariant])

  const currentUserReview = useMemo(() => {
    if (!product?.reviews?.length || !user?.user) return null
    return product.reviews.find((r) => r.user === user.user.userId || r.user === user.user._id)
  }, [product?.reviews, user])

  const otherReviews = useMemo(() => {
    if (!product?.reviews?.length || !user?.user) return product?.reviews || []
    return product.reviews.filter((r) => r.user !== user.user.userId && r.user !== user.user._id)
  }, [product?.reviews, user])

  // ✅ Memoized star renderer
  const renderStars = useCallback((rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            fill={rating >= star ? "#facc15" : "none"}
            viewBox="0 0 24 24"
            stroke="#facc15"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.973a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.387 2.46a1 1 0 00-.364 1.118l1.287 3.973c.3.921-.755 1.688-1.54 1.118l-3.387-2.46a1 1 0 00-1.175 0l-3.387 2.46c-.784.57-1.838-.197-1.539-1.118l1.287-3.973a1 1 0 00-.364-1.118l-3.387-2.46c-.784-.57-.38-1.81.588-1.81h4.18a1 1 0 00.951-.69l1.286-3.973z"
            />
          </svg>
        ))}
      </div>
    )
  }, [])

  // ✅ Loading state with skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return <div className="text-center mt-20 text-red-500">{error}</div>
  }

  if (!product || !selectedVariant) {
    return <div className="text-center mt-20">Product not found</div>
  }

  const price = selectedVariant.price
  const discount = selectedVariant.discountPercent || 0

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Preview */}
        <div>
          <img
            src={selectedImage ? `${API_BASE}${selectedImage}` : "/placeholder.svg"}
            className="w-full h-[400px] object-contain rounded"
            alt={product.title}
            loading="lazy"
          />
          <div className="flex gap-2 mt-2">
            {product.images?.others?.map((img, i) => (
              <img
                key={i}
                src={`${API_BASE}${img}`}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 object-cover border cursor-pointer transition-all ${
                  selectedImage === img ? "border-blue-500 scale-105" : "hover:scale-105"
                }`}
                alt={`${product.title} ${i + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <div className="flex items-center gap-2 my-2">
            {renderStars(Number.parseFloat(avgRating))}
            <span className="text-sm text-gray-700">
              {avgRating} / 5 ({product.reviews?.length || 0} review{product.reviews?.length !== 1 ? "s" : ""})
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
              {product.variants?.map((v, i) => (
                <button
                  key={i}
                  onClick={() => handleSizeClick(v)}
                  className={`px-4 py-1 border rounded-full cursor-pointer transition-all ${
                    v.size === selectedVariant.size
                      ? "bg-green-600 text-white scale-105"
                      : "hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => handleAddToCart(product)}
              disabled={addingToCart}
              className="bg-orange-500 text-white px-6 py-2 rounded cursor-pointer hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button className="bg-green-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-green-700 transition-all transform hover:scale-105">
              Buy Now
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-800 whitespace-pre-line">{product.description}</div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Product Details</h2>
        {product.details && typeof product.details === "object" ? (
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

      {/* Reviews Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Ratings & Reviews</h2>

        {/* Review submission form */}
        {token && !currentUserReview ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded shadow">
            <div>
              <label className="block text-sm font-medium mb-1">Your Rating:</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    onClick={() => setRating(star)}
                    xmlns="http://www.w3.org/2000/svg"
                    fill={rating >= star ? "#facc15" : "none"}
                    viewBox="0 0 24 24"
                    stroke="#facc15"
                    className="w-6 h-6 cursor-pointer transition hover:scale-110"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.973a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.387 2.46a1 1 0 00-.364 1.118l1.287 3.973c.3.921-.755 1.688-1.54 1.118l-3.387-2.46a1 1 0 00-1.175 0l-3.387 2.46c-.784.57-1.838-.197-1.539-1.118l1.287-3.973a1 1 0 00-.364-1.118l-3.387-2.46c-.784-.57-.38-1.81.588-1.81h4.18a1 1 0 00.951-.69l1.286-3.973z"
                    />
                  </svg>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your Review:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your honest feedback..."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Submit Review
            </button>
          </form>
        ) : token && currentUserReview ? (
          <p className="text-gray-500 mb-4">You have already reviewed this product.</p>
        ) : (
          <p className="text-gray-500 mb-4">Please login to write a review.</p>
        )}

        {/* Display reviews */}
        <div className="space-y-4">
          {currentUserReview && (
            <div className="border p-4 rounded bg-blue-50 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <div className="flex gap-2 items-center">
                  <p className="text-sm font-semibold text-blue-800">Your Review</p>
                  {renderStars(currentUserReview.rating)}
                </div>
                <p className="text-xs text-gray-400">{new Date(currentUserReview.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-700 mt-1">{currentUserReview.comment}</p>
            </div>
          )}

          {otherReviews.length === 0 && !currentUserReview && (
            <p className="text-gray-400 italic">No reviews yet. Be the first to review this product.</p>
          )}

          {(showAllReviews ? otherReviews : otherReviews.slice(0, 3)).map((r, i) => (
            <div key={i} className="border p-4 rounded bg-white shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <div className="flex gap-2 items-center">
                  <p className="text-sm font-semibold text-gray-800">{r.name || "User"}</p>
                  {renderStars(r.rating)}
                </div>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
              <div className="flex items-center gap-2 mt-2">
                <button className="text-xs text-green-600 hover:underline">👍 {r.likes?.length || 0}</button>
                <button className="text-xs text-red-600 hover:underline">👎 {r.dislikes?.length || 0}</button>
              </div>
            </div>
          ))}

          {otherReviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="text-blue-600 text-sm mt-2 hover:underline"
            >
              {showAllReviews ? "Show less" : "See more reviews"}
            </button>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {relatedProducts.map((p) => {
              const mainImage = p.images?.others?.[0] || "/placeholder.jpg"
              const firstVariant = p.variants?.[0]
              const price = firstVariant?.price || 0
              const discount = firstVariant?.discountPercent || 0
              const finalPrice = (price - (price * discount) / 100).toFixed(2)

              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/product/${p._id}`)}
                  className="cursor-pointer border rounded shadow-sm p-3 hover:shadow-md transition duration-200"
                >
                  <img
                    src={`${API_BASE}${mainImage}`}
                    alt={p.title}
                    className="w-full h-48 object-cover rounded mb-2 hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <h4 className="text-sm font-semibold">{p.title}</h4>
                  <p className="text-green-600 font-bold">₹{finalPrice}</p>
                  {discount > 0 && <p className="text-xs text-gray-400 line-through">₹{price}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
