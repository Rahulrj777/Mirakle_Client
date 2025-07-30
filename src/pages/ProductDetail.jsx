import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { useDispatch, useSelector } from "react-redux"
import { addToCart, setCartItem } from "../Redux/cartSlice"
import { axiosWithToken } from "../utils/axiosWithToken"
import { FaWhatsapp } from "react-icons/fa"

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState("")
  const [error, setError] = useState("")
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState("")
  const [shareLoading, setShareLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [productViews, setProductViews] = useState(0)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [productVideo, setProductVideo] = useState("")
  const [zoom, setZoom] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })

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

  const finalPrice = useMemo(() => {
    if (!selectedVariant) return "0.00"
    const price = selectedVariant.price
    const discount = selectedVariant.discountPercent || 0
    return (price - (price * discount) / 100).toFixed(2)
  }, [selectedVariant])

  const isOutOfStock = useMemo(() => {
    if (!product || !selectedVariant) return false
    const conditions = [
      product.isOutOfStock === true,
      selectedVariant.isOutOfStock === true,
      typeof selectedVariant.stock === "number" && selectedVariant.stock <= 0,
      selectedVariant.stock === "0" || selectedVariant.stock === 0,
    ]
    return conditions.some((condition) => condition)
  }, [product, selectedVariant])

  // Get current variant images (variant-specific images + main product images as fallback)
  const currentVariantImages = useMemo(() => {
    if (!product || !selectedVariant) return []

    // Get variant-specific images first
    const variantImages = selectedVariant.images || []

    // If variant has its own images, use those
    if (variantImages.length > 0) {
      return variantImages
    }

    // Otherwise, fall back to main product images
    return product.images?.others || []
  }, [product, selectedVariant])

  // Check if current variant is in cart
  const isInCart = useMemo(() => {
    if (!product || !selectedVariant || !cartItems.length) return false
    const variantKey = selectedVariant._id || selectedVariant.size || selectedVariantIndex
    const variantId = `${product._id}_${variantKey}`
    return cartItems.some((item) => item._id === product._id && item.variantId === variantId)
  }, [product, selectedVariant, selectedVariantIndex, cartItems])

  const token = user?.token

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      const found = res.data.find((p) => p._id === id)
      if (found) {
        setProduct(found)
        setProductVideo(found.video || "")
        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0])
          setSelectedVariantIndex(0)

          // Set initial image based on first variant
          const firstVariant = found.variants[0]
          if (firstVariant.images && firstVariant.images.length > 0) {
            setSelectedImage(firstVariant.images[0].url)
          } else if (found.images?.others?.[0]?.url) {
            setSelectedImage(found.images.others[0].url)
          }
        } else {
          setSelectedImage(found.images?.others?.[0]?.url || "")
        }
        setProductViews((prev) => prev + 1)
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
    if (!token) return
    try {
      const response = await axiosWithToken(token).get(`${API_BASE}/api/cart`)
      const cartData = response.data
      if (cartData && Array.isArray(cartData.items)) {
        dispatch(setCartItem(cartData.items))
      } else if (Array.isArray(cartData)) {
        dispatch(setCartItem(cartData))
      } else {
        dispatch(setCartItem([]))
      }
    } catch (error) {
      console.error("Failed to load cart:", error)
      dispatch(setCartItem([]))
    }
  }, [token, dispatch])

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

  const handleSizeClick = useCallback(
    (variant, index) => {
      setSelectedVariant(variant)
      setSelectedVariantIndex(index)

      // Update selected image when variant changes
      if (variant.images && variant.images.length > 0) {
        setSelectedImage(variant.images[0].url)
      } else if (product?.images?.others?.[0]?.url) {
        setSelectedImage(product.images.others[0].url)
      }
    },
    [product],
  )

  const handleAddToCart = useCallback(async () => {
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
    if (isOutOfStock) {
      alert("This product variant is currently out of stock")
      return
    }

    setAddingToCart(true)
    const variantKey =
      selectedVariant._id ||
      selectedVariant.size ||
      (selectedVariant.weight ? `${selectedVariant.weight.value}_${selectedVariant.weight.unit}` : selectedVariantIndex)
    const variantId = `${product._id}_${variantKey}`

    const productToAdd = {
      _id: product._id,
      title: product.title,
      images: product.images,
      variantId: variantId,
      size:
        selectedVariant.size ||
        (selectedVariant.weight ? `${selectedVariant.weight.value} ${selectedVariant.weight.unit}` : "N/A"),
      weight: {
        value: selectedVariant?.weight?.value || selectedVariant?.size,
        unit: selectedVariant?.weight?.unit || (selectedVariant?.size ? "size" : "unit"),
      },
      originalPrice: Number.parseFloat(selectedVariant.price),
      discountPercent: Number.parseFloat(selectedVariant.discountPercent) || 0,
      currentPrice: Number.parseFloat(finalPrice),
      stock: selectedVariant.stock,
      isOutOfStock: selectedVariant.isOutOfStock || false,
      stockMessage: isOutOfStock ? "Currently out of stock" : null,
    }

    try {
      dispatch(addToCart(productToAdd))
      const backendPayload = {
        productId: product._id,
        variantIndex: selectedVariantIndex,
        variantId: variantId,
      }
      try {
        await axiosWithToken(token).post(`${API_BASE}/api/cart/add`, backendPayload)
      } catch (syncError) {
        console.warn("Backend sync failed, but item added to local cart:", syncError)
      }
    } catch (err) {
      console.error("Add to cart failed:", err)
      alert("Something went wrong while adding to cart")
    } finally {
      setAddingToCart(false)
    }
  }, [
    addingToCart,
    user,
    selectedVariant,
    selectedVariantIndex,
    navigate,
    dispatch,
    finalPrice,
    isOutOfStock,
    product,
    token,
  ])

  const handleBuyNow = useCallback(async () => {
    await handleAddToCart()
    if (!isOutOfStock && selectedVariant) {
      const productForBuyNow = {
        _id: selectedVariant._id,
        title: product.title,
        images: product.images,
        size: selectedVariant.size,
        currentPrice: selectedVariant.currentPrice,
        quantity: 1,
        variantId: selectedVariant.variantId,
      }
      navigate("/checkout", {
        state: {
          mode: "buy-now",
          product: productForBuyNow,
        },
      })
    }
  }, [handleAddToCart, isOutOfStock, selectedVariant, product, navigate])

  const handleGoToCart = useCallback(() => {
    navigate("/AddToCart")
  }, [navigate])

  const handleShare = useCallback(
    async (platform) => {
      setShareLoading(true)
      const url = window.location.href
      const text = `Check out this amazing product: ${product.title}`
      try {
        switch (platform) {
          case "whatsapp":
            window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`)
            break
          case "copy":
            await navigator.clipboard.writeText(url)
            alert("Link copied to clipboard!")
            break
          default:
            break
        }
      } catch (error) {
        console.error("Share failed:", error)
        alert("Failed to share")
      } finally {
        setShareLoading(false)
        setShowShareModal(false)
      }
    },
    [product],
  )

  const handleImageClick = useCallback((imageUrl) => {
    setModalImage(imageUrl)
    setShowImageModal(true)
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      if (!zoom) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setZoomPosition({ x: Math.min(Math.max(x, 0), 100), y: Math.min(Math.max(y, 0), 100) })
    },
    [zoom],
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
        reviewImages.forEach((image) => {
          formData.append("images", image)
        })

        const response = await axiosWithToken(token).post(`${API_BASE}/api/products/${id}/review`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        if (response.data) {
          setReviewRating(0)
          setReviewComment("")
          setReviewImages([])
          setReviewImagePreviews([])
          setReviewError("")
          fetchProduct()
          alert("Review submitted successfully!")
        }
      } catch (err) {
        console.error("Review submission error:", err)
        setReviewError(err.response?.data?.message || "Failed to submit review")
      } finally {
        setSubmittingReview(false)
      }
    },
    [reviewRating, reviewComment, reviewImages, id, token, fetchProduct],
  )

  const handleDeleteReview = useCallback(
    async (reviewId) => {
      if (!confirm("Are you sure you want to delete your review?")) return

      setActionLoading((prev) => ({ ...prev, [`delete-${reviewId}`]: true }))
      try {
        await axiosWithToken(token).delete(`${API_BASE}/api/products/${id}/review/${reviewId}`)
        fetchProduct()
        alert("Review deleted successfully!")
      } catch (error) {
        console.error("Delete review failed:", error)
        alert("Failed to delete review. Please try again.")
      } finally {
        setActionLoading((prev) => ({ ...prev, [`delete-${reviewId}`]: false }))
      }
    },
    [id, token, fetchProduct],
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
      {/* Breadcrumb */}
      <nav className="text-sm breadcrumbs mb-4">
        <ul className="flex space-x-2 text-gray-600">
          <li>
            <a href="/" className="hover:text-blue-600">
              Home
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/shop/allproduct" className="hover:text-blue-600">
              Products
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.title}</li>
        </ul>
      </nav>

      {/* Product Images and Info */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Preview - Make this sticky */}
        <div className="space-y-4 sticky top-4 self-start">
          <div className="relative overflow-hidden rounded-lg border">
            <img
              src={selectedImage || "/placeholder.svg?height=500&width=500"}
              className="w-full h-[500px] object-contain cursor-zoom-in transition-transform duration-200"
              alt={product.title}
              loading="lazy"
              onClick={() => handleImageClick(selectedImage)}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              style={
                zoom
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transform: "scale(1.5)",
                    }
                  : {}
              }
            />
          </div>

          {/* Thumbnail Images - Show current variant images */}
          <div className="flex gap-2 overflow-x-auto">
            {currentVariantImages.map((img, i) => (
              <img
                key={i}
                src={img.url || "/placeholder.svg?height=80&width=80"}
                onClick={() => setSelectedImage(img.url)}
                className={`w-20 h-20 object-cover border cursor-pointer transition-all flex-shrink-0 rounded ${
                  selectedImage === img.url ? "border-blue-500 scale-105" : "hover:scale-105"
                }`}
                alt={`${product.title} ${selectedVariant.size} ${i + 1}`}
                loading="lazy"
              />
            ))}
            {/* Video thumbnail if available */}
            {productVideo && (
              <div
                onClick={() => setShowVideoModal(true)}
                className="w-20 h-20 bg-gray-200 border cursor-pointer transition-all flex-shrink-0 hover:scale-105 flex items-center justify-center rounded"
              >
                <span className="text-2xl">▶️</span>
              </div>
            )}
          </div>

          {/* Show variant-specific image indicator */}
          {selectedVariant.images && selectedVariant.images.length > 0 && (
            <div className="text-center">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                📸 {selectedVariant.size} variant images ({selectedVariant.images.length})
              </span>
            </div>
          )}
        </div>

        {/* Product Info - This will scroll normally */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            <button
              onClick={() => setShowShareModal(true)}
              className="text-gray-500 hover:text-blue-600 transition-colors"
              title="Share product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </button>
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Number.parseFloat(avgRating))}
              <span className="text-sm text-gray-700 font-medium">{avgRating} / 5</span>
            </div>
            <span className="text-sm text-gray-500">
              ({product.reviews?.length || 0} review{product.reviews?.length !== 1 ? "s" : ""})
            </span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-500">{productViews} views</span>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-green-600">₹{finalPrice}</span>
              {discount > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through">₹{price}</span>
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full font-medium">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
            {discount > 0 && (
              <p className="text-sm text-green-600">You save ₹{(price - Number.parseFloat(finalPrice)).toFixed(2)}</p>
            )}
          </div>

          {/* Updated Stock Status */}
          {isOutOfStock ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✕</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold">Out of Stock</h3>
                  <p className="text-red-600 text-sm">This variant is currently unavailable</p>
                  <p className="text-blue-600 text-sm mt-1">Check back later for availability</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📦</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-blue-800 font-semibold">Available</h3>
                  {typeof selectedVariant.stock === "number" && selectedVariant.stock <= 10 && (
                    <p className="text-orange-600 text-sm font-medium">
                      Only {selectedVariant.stock} left - Order soon!
                    </p>
                  )}
                  <p className="text-blue-600 text-sm">Ready to ship</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    {typeof selectedVariant.stock === "number" ? `${selectedVariant.stock} Available` : "In Stock"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Size/Variant Selection */}
          <div className="space-y-3">
            <p className="font-medium text-gray-900">Select Size:</p>
            <div className="flex gap-2 flex-wrap">
              {product.variants?.map((v, i) => {
                const variantOutOfStock =
                  v.isOutOfStock === true ||
                  (typeof v.stock === "number" && v.stock <= 0) ||
                  v.stock === "0" ||
                  v.stock === 0
                return (
                  <button
                    key={`variant-${i}`}
                    onClick={() => handleSizeClick(v, i)}
                    disabled={variantOutOfStock}
                    className={`px-4 py-3 border rounded-lg cursor-pointer transition-all font-medium relative min-w-[60px] ${
                      i === selectedVariantIndex
                        ? variantOutOfStock
                          ? "bg-red-100 text-red-600 border-red-300 cursor-not-allowed"
                          : "bg-blue-600 text-white border-blue-600 shadow-md"
                        : variantOutOfStock
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    {v.size}
                    {variantOutOfStock && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ✕
                      </span>
                    )}
                    {/* Show image count indicator */}
                    {v.images && v.images.length > 0 && (
                      <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        📸
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isOutOfStock ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full bg-gray-400 text-white px-6 py-4 rounded-lg cursor-not-allowed opacity-75 font-medium text-lg"
                  title="This variant is currently out of stock"
                >
                  📦 Currently Unavailable
                </button>
                <p className="text-xs text-gray-500 text-center">This size is temporarily out of stock</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {isInCart ? (
                  <button
                    onClick={handleGoToCart}
                    className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-all font-medium text-lg"
                  >
                    🛒 Go to Cart
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="bg-orange-500 text-white px-6 py-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg"
                  >
                    {addingToCart ? "Adding..." : "🛒 Add to Cart"}
                  </button>
                )}
                <button
                  onClick={handleBuyNow}
                  className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-all font-medium text-lg"
                >
                  ⚡ Buy Now
                </button>
              </div>
            )}
          </div>

          {/* Description Section - Moved to right side */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📄</span>
              <h3 className="text-lg font-semibold text-gray-900">Product Description</h3>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              {product.description || "No description available for this product."}
            </div>
          </div>

          {/* Details Section - Moved to right side */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📋</span>
              <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
            </div>
            {product.details && typeof product.details === "object" ? (
              <div className="space-y-2">
                {Object.entries(product.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 px-3 bg-white rounded text-sm">
                    <span className="font-medium text-gray-600 capitalize">{key}:</span>
                    <span className="text-gray-900 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-2xl mb-1 block">📋</span>
                <p className="text-gray-500 text-sm">No additional details available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rest of your existing code for reviews, related products, modals, etc. */}
      {/* ... (keeping the rest of the component unchanged) ... */}

      {/* Modals */}
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={modalImage || "/placeholder.svg?height=600&width=600"}
              alt="Product"
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && productVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <video src={productVideo} controls autoPlay className="max-w-full max-h-full" />
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Updated Share Modal - Only WhatsApp and Copy Link */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Share this product</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleShare("whatsapp")}
                disabled={shareLoading}
                className="flex items-center justify-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-all"
              >
                <FaWhatsapp className="text-green-500 text-xl" />
                <span>Share on WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare("copy")}
                disabled={shareLoading}
                className="flex items-center justify-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-all"
              >
                <span className="text-xl">📋</span>
                <span>Copy Link</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
