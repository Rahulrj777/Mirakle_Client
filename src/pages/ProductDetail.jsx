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
  const [error, setError] = useState("")
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  // Review form states
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState("")
  // Review list states
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))
    } catch {
      return null
    }
  }, [])

  const cartItems = useSelector((state) => {
    const items = state.cart?.items
    return Array.isArray(items) ? items : []
  })

  const token = user?.token

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      const found = res.data.find((p) => p._id === id)
      if (found) {
        setProduct(found)
        // ✅ MODIFIED: Set selectedImage to the URL from the product object
        setSelectedImage(found.images?.others?.[0]?.url || "")
        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0])
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
  }, [id])

  const fetchRelated = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/related/${id}`)
      setRelatedProducts(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Failed to fetch related products", err)
      setRelatedProducts([])
    }
  }, [id])

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

  const handleSizeClick = useCallback((variant) => {
    setSelectedVariant(variant)
  }, [])

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
        dispatch(addToCart(productToAdd))
        const syncResult = await safeApiCall(async (api) => await api.post("/cart/add", { item: productToAdd }))
        if (syncResult) {
          console.log("✅ Cart synced to backend")
        } else {
          console.warn("⚠️ Backend sync failed, but item added to local cart")
        }
      } catch (err) {
        console.error("❌ Add to cart failed:", err)
        alert("Something went wrong while adding to cart")
      } finally {
        setAddingToCart(false)
      }
    },
    [addingToCart, user, selectedVariant, navigate, dispatch],
  )

  const handleReviewImageChange = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      setReviewError("You can upload maximum 5 images")
      return
    }
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setReviewError("Each image must be less than 5MB")
      return
    }
    setReviewImages(files)
    setReviewError("")
    const previews = files.map((file) => URL.createObjectURL(file))
    setReviewImagePreviews(previews)
  }, [])

  const removeReviewImage = useCallback(
    (index) => {
      const newImages = reviewImages.filter((_, i) => i !== index)
      const newPreviews = reviewImagePreviews.filter((_, i) => i !== index)
      URL.revokeObjectURL(reviewImagePreviews[index])
      setReviewImages(newImages)
      setReviewImagePreviews(newPreviews)
    },
    [reviewImages, reviewImagePreviews],
  )

  const handleReviewSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!reviewRating || !reviewComment.trim()) {
        setReviewError("Please provide both rating and review.")
        return
      }
      if (reviewComment.trim().length < 10) {
        setReviewError("Review must be at least 10 characters long.")
        return
      }
      setSubmittingReview(true)
      setReviewError("")
      try {
        const formData = new FormData()
        formData.append("rating", reviewRating)
        formData.append("comment", reviewComment.trim())
        reviewImages.forEach((image, index) => {
          formData.append("images", image)
        })
        const result = await safeApiCall(async (api) => {
          return await api.post(`/products/${id}/review`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
        })
        if (result) {
          setReviewRating(0)
          setReviewComment("")
          setReviewImages([])
          setReviewImagePreviews([])
          setReviewError("")
          fetchProduct()
          alert("Review submitted successfully!")
        } else {
          setReviewError("Failed to submit review. Please try again.")
        }
      } catch (err) {
        console.error("Review submission error:", err)
        setReviewError(err.message || "Failed to submit review")
      } finally {
        setSubmittingReview(false)
      }
    },
    [reviewRating, reviewComment, reviewImages, id, fetchProduct],
  )

  const handleDeleteReview = useCallback(
    async (reviewId) => {
      if (!confirm("Are you sure you want to delete your review?")) return
      setActionLoading((prev) => ({ ...prev, [`delete-${reviewId}`]: true }))
      const result = await safeApiCall(async (api) => {
        return await api.delete(`/products/${id}/review/${reviewId}`)
      })
      if (result) {
        fetchProduct()
        alert("Review deleted successfully!")
      } else {
        alert("Failed to delete review. Please try again.")
      }
      setActionLoading((prev) => ({ ...prev, [`delete-${reviewId}`]: false }))
    },
    [id, fetchProduct],
  )

  const handleLikeReview = useCallback(
    async (reviewId) => {
      if (!user?.token) {
        alert("Please login to like reviews")
        return
      }
      setActionLoading((prev) => ({ ...prev, [`like-${reviewId}`]: true }))
      const result = await safeApiCall(async (api) => {
        return await api.post(`/products/${id}/review/${reviewId}/like`)
      })
      if (result) {
        setProduct((prev) => ({
          ...prev,
          reviews: prev.reviews.map((review) => (review._id === reviewId ? result.review : review)),
        }))
      }
      setActionLoading((prev) => ({ ...prev, [`like-${reviewId}`]: false }))
    },
    [user, id],
  )

  const handleDislikeReview = useCallback(
    async (reviewId) => {
      if (!user?.token) {
        alert("Please login to dislike reviews")
        return
      }
      setActionLoading((prev) => ({ ...prev, [`dislike-${reviewId}`]: true }))
      const result = await safeApiCall(async (api) => {
        return await api.post(`/products/${id}/review/${reviewId}/dislike`)
      })
      if (result) {
        setProduct((prev) => ({
          ...prev,
          reviews: prev.reviews.map((review) => (review._id === reviewId ? result.review : review)),
        }))
      }
      setActionLoading((prev) => ({ ...prev, [`dislike-${reviewId}`]: false }))
    },
    [user, id],
  )

  const avgRating = useMemo(() => {
    if (!Array.isArray(product?.reviews) || product.reviews.length === 0) return 0
    const validRatings = product.reviews.filter((r) => r && typeof r.rating === "number")
    if (validRatings.length === 0) return 0
    const total = validRatings.reduce((acc, r) => acc + r.rating, 0)
    return (total / validRatings.length).toFixed(1)
  }, [product?.reviews])

  const finalPrice = useMemo(() => {
    if (!selectedVariant) return "0.00"
    const price = selectedVariant.price
    const discount = selectedVariant.discountPercent || 0
    return (price - (price * discount) / 100).toFixed(2)
  }, [selectedVariant])

  const currentUserReview = useMemo(() => {
    if (!Array.isArray(product?.reviews)) return null
    const currentUserId = user?.user?.userId || user?.user?._id
    if (!currentUserId) return null
    return product.reviews.find((r) => r?.user === currentUserId)
  }, [product?.reviews, user])

  const otherReviews = useMemo(() => {
    if (!Array.isArray(product?.reviews)) return []
    const currentUserId = user?.user?.userId || user?.user?._id
    if (!currentUserId) return product.reviews
    return product.reviews.filter((r) => r?.user !== currentUserId)
  }, [product?.reviews, user])

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
  const reviewsToShow = showAllReviews ? otherReviews : otherReviews.slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Product Images and Info */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Preview */}
        <div>
          <img
            // ✅ MODIFIED: Use selectedImage directly (it's already a full URL)
            src={selectedImage || "/placeholder.svg"}
            className="w-full h-[400px] object-contain rounded"
            alt={product.title}
            loading="lazy"
          />
          <div className="flex gap-2 mt-2">
            {product.images?.others?.map((img, i) => (
              <img
                key={i}
                // ✅ MODIFIED: Use img.url for thumbnail images
                src={img.url || "/placeholder.svg"}
                onClick={() => setSelectedImage(img.url)}
                className={`w-20 h-20 object-cover border cursor-pointer transition-all ${
                  selectedImage === img.url ? "border-blue-500 scale-105" : "hover:scale-105"
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
      {/* Ratings & Reviews Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Ratings & Reviews</h2>
        {/* Review Statistics */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{avgRating}</div>
                <div className="flex justify-center mb-1">{renderStars(Number.parseFloat(avgRating))}</div>
                <div className="text-sm text-gray-600">
                  {product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = product.reviews.filter(
                    (r) => r && typeof r.rating === "number" && r.rating === star,
                  ).length
                  const percentage = product.reviews.length > 0 ? (count / product.reviews.length) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-sm w-8">{star}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        {/* Review Form - Only show if user hasn't reviewed yet */}
        {token && !currentUserReview ? (
          <form onSubmit={handleReviewSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Write a Review</h3>
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-1">Your Rating:</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    onClick={() => setReviewRating(star)}
                    xmlns="http://www.w3.org/2000/svg"
                    fill={reviewRating >= star ? "#facc15" : "none"}
                    viewBox="0 0 24 24"
                    stroke="#facc15"
                    className="w-8 h-8 cursor-pointer transition hover:scale-110"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.973a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.387 2.46a1 1 0 00-.364 1.118l1.287 3.973c.3.921-.755 1.688-1.54 1.118l-3.387-2.46a1 1 0 00-1.175 0l-3.387 2.46c-.784.57-1.838-.197-1.539-1.118l1.287-3.973a1 1 0 00-.364-1.118l-3.387-2.46c-.784-.57-.38-1.81.588-1.81h4.18a1 1 0 00.951-.69l1.286-3.973z"
                    />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {reviewRating > 0 ? `${reviewRating} star${reviewRating > 1 ? "s" : ""}` : "Click to rate"}
                </span>
              </div>
            </div>
            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-1">Your Review:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience with this product... (minimum 10 characters)"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {reviewComment.length}/1000 characters{" "}
                {reviewComment.length < 10 && reviewComment.length > 0 && "(minimum 10 required)"}
              </div>
            </div>
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-1">Add Photos (Optional):</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleReviewImageChange}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">You can upload up to 5 images (max 5MB each)</div>
            </div>
            {/* Image Previews */}
            {reviewImagePreviews.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Photo Previews:</label>
                <div className="flex flex-wrap gap-2">
                  {reviewImagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
            <button
              type="submit"
              disabled={submittingReview || !reviewRating || !reviewComment.trim() || reviewComment.trim().length < 10}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : token && currentUserReview ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700 font-medium">✅ You have already reviewed this product.</p>
            <p className="text-sm text-green-600">You can delete your review and write a new one if needed.</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-gray-600">Please login to write a review.</p>
          </div>
        )}
        {/* Reviews List */}
        <div className="space-y-4">
          {/* Current User's Review */}
          {currentUserReview && (
            <div className="border p-4 rounded shadow-sm bg-blue-50 border-blue-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <p className="text-sm font-semibold text-blue-800">Your Review</p>
                  {renderStars(currentUserReview.rating)}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">{new Date(currentUserReview.createdAt).toLocaleDateString()}</p>
                  <button
                    onClick={() => handleDeleteReview(currentUserReview._id)}
                    disabled={actionLoading[`delete-${currentUserReview._id}`]}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    {actionLoading[`delete-${currentUserReview._id}`] ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{currentUserReview.comment}</p>
              {/* Review Images */}
              {currentUserReview.images && currentUserReview.images.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {currentUserReview.images.map((image, index) => (
                      <img
                        key={index}
                        src={`${API_BASE}${image}`}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                          window.open(`${API_BASE}${image}`, "_blank")
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Other Reviews */}
          {reviewsToShow.length === 0 && !currentUserReview && (
            <div className="text-center py-8">
              <p className="text-gray-400 italic">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
          {reviewsToShow.map((review) => {
            const isLikeLoading = actionLoading[`like-${review._id}`]
            const isDislikeLoading = actionLoading[`dislike-${review._id}`]
            return (
              <div key={review._id} className="border p-4 rounded shadow-sm bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <p className="text-sm font-semibold text-gray-800">{review.name || "User"}</p>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={`${API_BASE}${image}`}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => {
                            window.open(`${API_BASE}${image}`, "_blank")
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Like/Dislike buttons */}
                {/* <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleLikeReview(review._id)}
                    disabled={isLikeLoading}
                    className={`text-xs flex items-center gap-1 hover:underline transition-colors ${
                      review.userLiked ? "text-blue-600 font-semibold" : "text-green-600"
                    } disabled:opacity-50`}
                  >
                    <span>👍</span>
                    <span>{isLikeLoading ? "..." : review.likes?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => handleDislikeReview(review._id)}
                    disabled={isDislikeLoading}
                    className={`text-xs flex items-center gap-1 hover:underline transition-colors ${
                      review.userDisliked ? "text-red-600 font-semibold" : "text-red-500"
                    } disabled:opacity-50`}
                  >
                    <span>👎</span>
                    <span>{isDislikeLoading ? "..." : review.dislikes?.length || 0}</span>
                  </button>
                </div> */}
              </div>
            )
          })}
          {/* Show More/Less Button */}
          {otherReviews.length > 3 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-blue-600 text-sm hover:underline"
              >
                {showAllReviews ? `Show Less` : `Show ${otherReviews.length - 3} More Reviews`}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {relatedProducts.map((p) => {
              // ✅ MODIFIED: Access image URL from the object
              const mainImage = p.images?.others?.[0]?.url || "/placeholder.jpg"
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
                    src={mainImage || "/placeholder.svg"}
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
