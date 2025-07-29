"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { useDispatch, useSelector } from "react-redux"
import { addToCart, setCartItem } from "../Redux/cartSlice"
import { axiosWithToken } from "../utils/axiosWithToken"

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Core state
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState("description")
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState("")
  const [relatedProducts, setRelatedProducts] = useState([])

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
    return (
      product.isOutOfStock === true ||
      selectedVariant.isOutOfStock === true ||
      (typeof selectedVariant.stock === "number" && selectedVariant.stock <= 0) ||
      selectedVariant.stock === "0" ||
      selectedVariant.stock === 0
    )
  }, [product, selectedVariant])

  const avgRating = useMemo(() => {
    if (!Array.isArray(product?.reviews) || product.reviews.length === 0) return 0
    const validRatings = product.reviews.filter((r) => r && typeof r.rating === "number")
    if (validRatings.length === 0) return 0
    const total = validRatings.reduce((acc, r) => acc + r.rating, 0)
    return (total / validRatings.length).toFixed(1)
  }, [product?.reviews])

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const res = await axios.get(`${API_BASE}/api/products/all-products`)
      const found = res.data.find((p) => p._id === id)

      if (found) {
        setProduct(found)
        setSelectedImage(found.images?.others?.[0]?.url || "")
        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0])
          setSelectedVariantIndex(0)
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
    if (!user?.token || cartItems.length > 0) return
    try {
      const response = await axiosWithToken(user.token).get(`${API_BASE}/api/cart`)
      const cartData = response.data
      if (cartData && Array.isArray(cartData.items)) {
        dispatch(setCartItem(cartData.items))
      } else if (Array.isArray(cartData)) {
        dispatch(setCartItem(cartData))
      }
    } catch (error) {
      console.error("Failed to load cart:", error)
    }
  }, [user?.token, cartItems.length, dispatch])

  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchRelated()
    }
  }, [id, fetchProduct, fetchRelated])

  useEffect(() => {
    loadCartSafely()
  }, [loadCartSafely])

  const handleSizeClick = useCallback((variant, index) => {
    setSelectedVariant(variant)
    setSelectedVariantIndex(index)
    setQuantity(1)
  }, [])

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
    const variantKey = selectedVariant._id || selectedVariant.size || selectedVariantIndex
    const variantId = `${product._id}_${variantKey}`

    const productToAdd = {
      _id: product._id,
      title: product.title,
      images: product.images,
      variantId: variantId,
      size: selectedVariant.size || "N/A",
      originalPrice: Number.parseFloat(selectedVariant.price),
      discountPercent: Number.parseFloat(selectedVariant.discountPercent) || 0,
      currentPrice: Number.parseFloat(finalPrice),
      quantity: quantity,
      stock: selectedVariant.stock,
      isOutOfStock: selectedVariant.isOutOfStock || false,
    }

    try {
      dispatch(addToCart(productToAdd))
      try {
        await axiosWithToken(user.token).post(`${API_BASE}/api/cart/add`, {
          productId: product._id,
          variantIndex: selectedVariantIndex,
          variantId: variantId,
          quantity: quantity,
        })
      } catch (syncError) {
        console.warn("Backend sync failed, but item added to local cart:", syncError)
      }
      alert(`✅ Added ${quantity} ${productToAdd.size} to cart successfully`)
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
    quantity,
    product,
  ])

  const handleBuyNow = useCallback(async () => {
    await handleAddToCart()
    if (!isOutOfStock && selectedVariant) {
      navigate("/cart")
    }
  }, [handleAddToCart, isOutOfStock, selectedVariant, navigate])

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
            <a href="/products" className="hover:text-blue-600">
              Products
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.title}</li>
        </ul>
      </nav>

      {/* Product Images and Info */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Preview with contained zoom */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border">
            <img
              src={selectedImage || "/placeholder.svg?height=500&width=500"}
              className="w-full h-[500px] object-contain cursor-zoom-in transition-transform duration-300 hover:scale-110"
              alt={product.title}
              loading="lazy"
              onClick={() => {
                setModalImage(selectedImage)
                setShowImageModal(true)
              }}
            />
          </div>

          {/* Thumbnail Images */}
          <div className="flex gap-2 overflow-x-auto">
            {product.images?.others?.map((img, i) => (
              <img
                key={i}
                src={img.url || "/placeholder.svg?height=80&width=80"}
                onClick={() => setSelectedImage(img.url)}
                className={`w-20 h-20 object-cover border cursor-pointer transition-all flex-shrink-0 rounded ${
                  selectedImage === img.url ? "border-blue-500 scale-105" : "hover:scale-105"
                }`}
                alt={`${product.title} ${i + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Number.parseFloat(avgRating))}
              <span className="text-sm text-gray-700 font-medium">{avgRating} / 5</span>
            </div>
            <span className="text-sm text-gray-500">
              ({product.reviews?.length || 0} review{product.reviews?.length !== 1 ? "s" : ""})
            </span>
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

          {/* Enhanced Stock Status */}
          {isOutOfStock ? (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold">Out of Stock</h3>
                  <p className="text-red-600 text-sm">This variant is currently unavailable</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-l-4 border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-green-800 font-semibold">In Stock</h3>
                      {typeof selectedVariant.stock === "number" && selectedVariant.stock <= 10 && (
                        <p className="text-orange-600 text-sm font-medium">
                          Only {selectedVariant.stock} left - Order soon!
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-700">
                        {typeof selectedVariant.stock === "number" ? selectedVariant.stock : "∞"}
                      </div>
                      <div className="text-xs text-green-600 uppercase tracking-wide">Available</div>
                    </div>
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
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity Selection */}
          {!isOutOfStock && (
            <div className="space-y-2">
              <p className="font-medium text-gray-900">Quantity:</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    className="px-4 py-2 text-lg hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    className="px-4 py-2 text-lg hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                    disabled={quantity >= selectedVariant.stock}
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">Max: {selectedVariant.stock} available</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full bg-gray-400 text-white px-6 py-4 rounded-lg cursor-not-allowed opacity-75 font-medium text-lg"
              >
                📦 Currently Unavailable
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="bg-orange-500 text-white px-6 py-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg"
                >
                  {addingToCart ? "Adding..." : "🛒 Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-all font-medium text-lg"
                >
                  ⚡ Buy Now
                </button>
              </div>
            )}
          </div>

          {/* Product Highlights */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Product Highlights</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Free shipping on orders above ₹499</li>
              <li>✅ 7-day easy returns</li>
              <li>✅ Cash on delivery available</li>
              <li>✅ 100% authentic products</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="mt-12">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {["description", "details", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab} {tab === "reviews" && `(${product.reviews?.length || 0})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {product.description || "No description available."}
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              {product.details && typeof product.details === "object" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600 capitalize">{key}:</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No additional details available.</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map((review, index) => (
                    <div key={index} className="border p-6 rounded-lg shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(review.name || "User").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{review.name || "Anonymous User"}</p>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <p className="text-gray-400 italic text-lg">No reviews yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {relatedProducts.slice(0, 10).map((p) => {
              const mainImage = p.images?.others?.[0]?.url || "/placeholder.svg?height=200&width=200"
              const firstVariant = p.variants?.[0]
              const price = firstVariant?.price || 0
              const discount = firstVariant?.discountPercent || 0
              const finalPrice = (price - (price * discount) / 100).toFixed(2)

              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/product/${p._id}`)}
                  className="cursor-pointer border rounded-lg shadow-sm p-4 hover:shadow-md transition duration-200 relative group"
                >
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      {discount}% OFF
                    </div>
                  )}
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img
                      src={mainImage || "/placeholder.svg"}
                      alt={p.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <h4 className="text-sm font-semibold mb-2 line-clamp-2">{p.title}</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">₹{finalPrice}</span>
                      {discount > 0 && <span className="text-xs text-gray-400 line-through">₹{price}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
    </div>
  )
}

export default ProductDetail
