"use client"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { useDispatch, useSelector } from "react-redux"
import { addToCart, setCartItem } from "../Redux/cartSlice"
import { safeApiCall } from "../utils/axiosWithToken"
import { calculateDiscountedPrice } from "../utils/shopPageUtils"

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage] = useState("")
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const dispatch = useDispatch()

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
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/api/products/${id}`)
      setProduct(res.data)
      if (res.data.variants && res.data.variants.length > 0) {
        setSelectedVariant(res.data.variants[0])
      }
      // Set initial image to thumbnail or first other image
      if (res.data.images?.thumbnail?.url) {
        setSelectedImage(res.data.images.thumbnail.url)
      } else if (res.data.images?.others?.[0]?.url) {
        setSelectedImage(res.data.images.others[0].url)
      } else {
        setSelectedImage("/placeholder.svg?height=500&width=500&text=No Image")
      }
      fetchRelatedProducts(id)
    } catch (err) {
      console.error("Error fetching product details:", err)
      setError("Failed to load product details.")
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchRelatedProducts = useCallback(async (productId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/related/${productId}`)
      setRelatedProducts(res.data)
    } catch (err) {
      console.error("Error fetching related products:", err)
    }
  }, [])

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
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [id])

  useEffect(() => {
    loadCartSafely()
  }, [loadCartSafely])

  const handleVariantChange = useCallback(
    (e) => {
      const selectedSku = e.target.value
      const variant = product.variants.find((v) => v.sku === selectedSku)
      setSelectedVariant(variant)
    },
    [product],
  )

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl)
  }, [])

  const handleRelatedProductClick = useCallback(
    (relatedProductId) => {
      navigate(`/product/${relatedProductId}`)
      setProduct(null)
      setLoading(true)
      setError(null)
      setSelectedVariant(null)
      setSelectedImage("")
      setRelatedProducts([])
    },
    [navigate],
  )

  const handleSizeClick = useCallback((variant) => {
    setSelectedVariant(variant)
  }, [])

  const handleAddToCart = useCallback(
    async (product) => {
      if (!user?.token) {
        alert("Please login to add items to cart")
        navigate("/login_signup")
        return
      }
      if (!selectedVariant) {
        alert("Please select a variant")
        return
      }
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
        currentPrice: Number.parseFloat(
          calculateDiscountedPrice(selectedVariant.price, selectedVariant.discountPercent),
        ),
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
      }
    },
    [user, selectedVariant, navigate, dispatch],
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

  if (loading) return <div className="text-center py-8">Loading product details...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>
  if (!product) return <div className="text-center py-8">Product not found.</div>

  const allImages = []
  if (product.images?.thumbnail?.url) {
    allImages.push(product.images.thumbnail.url)
  }
  if (product.images?.others && product.images.others.length > 0) {
    allImages.push(...product.images.others.map((img) => img.url))
  }

  const displayPrice = selectedVariant
    ? calculateDiscountedPrice(selectedVariant.price, selectedVariant.discountPercent)
    : "N/A"
  const originalPrice = selectedVariant?.price
  const discountPercent = selectedVariant?.discountPercent

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image Gallery */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md h-96 bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg shadow-md mb-4">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.length > 0 ? (
              allImages.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl || "/placeholder.svg"}
                  alt={`Product thumbnail ${index}`}
                  className={`w-20 h-20 object-cover border rounded-md cursor-pointer ${selectedImage === imgUrl ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300"}`}
                  onClick={() => handleImageClick(imgUrl)}
                />
              ))
            ) : (
              <img
                src="/placeholder.svg?height=80&width=80&text=No Image"
                alt="No Image thumbnail"
                className="w-20 h-20 object-cover border rounded-md"
              />
            )}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
          {product.brand && <p className="text-lg text-gray-600 mb-2">Brand: {product.brand}</p>}
          {product.productType && <p className="text-md text-gray-500 mb-4">Category: {product.productType}</p>}

          <p className="text-gray-700 mb-6">{product.description}</p>

          {product.variants && product.variants.length > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-green-600">₹{displayPrice}</span>
                {discountPercent > 0 && (
                  <span className="text-lg text-gray-500 line-through">₹{originalPrice?.toFixed(2)}</span>
                )}
                {discountPercent > 0 && <span className="text-lg text-red-500">({discountPercent}% off)</span>}
              </div>

              <div className="mb-4">
                <label htmlFor="variant-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Variant:
                </label>
                <select
                  id="variant-select"
                  onChange={handleVariantChange}
                  value={selectedVariant?.sku || ""}
                  className="p-2 border border-gray-300 rounded-md w-full md:w-1/2"
                >
                  {product.variants.map((variant) => (
                    <option key={variant.sku} value={variant.sku}>
                      {variant.size} / {variant.color} (Stock: {variant.stock})
                    </option>
                  ))}
                </select>
              </div>

              {selectedVariant && (
                <div className="mb-6 text-gray-700">
                  <p>
                    <strong>Size:</strong> {selectedVariant.size}
                  </p>
                  <p>
                    <strong>Color:</strong> {selectedVariant.color}
                  </p>
                  <p>
                    <strong>SKU:</strong> {selectedVariant.sku}
                  </p>
                  <p>
                    <strong>Stock:</strong> {selectedVariant.stock}
                  </p>
                  {selectedVariant.stock === 0 && <p className="text-red-500 font-semibold">Out of Stock</p>}
                </div>
              )}
            </>
          ) : (
            <div className="text-lg text-gray-600 mb-6">No variants available for this product.</div>
          )}

          {product.isOutOfStock && <span className="text-red-500 font-semibold mt-2 block">Overall Out of Stock</span>}

          {/* Add to Cart Button */}
          <button
            onClick={() => handleAddToCart(product)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
            disabled={selectedVariant?.stock === 0 || product.isOutOfStock}
          >
            Add to Cart
          </button>
        </div>
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
          {otherReviews.length === 0 && !currentUserReview && (
            <div className="text-center py-8">
              <p className="text-gray-400 italic">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
          {otherReviews.map((review) => {
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
                <div className="flex items-center gap-4 mt-2">
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
                </div>
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

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-center mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct._id}
                className="border rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => handleRelatedProductClick(relatedProduct._id)}
              >
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {relatedProduct.images?.others?.[0]?.url ? (
                    <img
                      src={relatedProduct.images.others[0].url || "/placeholder.svg"}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg?height=192&width=192&text=No Image"
                      alt="No Image"
                      className="w-full h-full object-cover text-gray-500"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 truncate">{relatedProduct.title}</h3>
                  {relatedProduct.productType && (
                    <p className="text-sm text-gray-600 mb-2">{relatedProduct.productType}</p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-600">
                      ₹
                      {calculateDiscountedPrice(
                        relatedProduct.variants[0]?.price,
                        relatedProduct.variants[0]?.discountPercent,
                      )}
                    </span>
                    {relatedProduct.variants[0]?.discountPercent > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{relatedProduct.variants[0]?.price.toFixed(2)}
                      </span>
                    )}
                    {relatedProduct.variants[0]?.discountPercent > 0 && (
                      <span className="text-sm text-red-500">({relatedProduct.variants[0]?.discountPercent}% off)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
