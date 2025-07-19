import { Link } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { FaStar, FaRegThumbsUp, FaRegThumbsDown, FaThumbsUp, FaThumbsDown } from "react-icons/fa"
import { useSelector, useDispatch } from "react-redux"
import { setCartItem } from "../Redux/cartSlice"
import { toast } from "react-toastify"

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items) || []
  const currentUserId = useSelector((state) => state.cart.userId)
  const user = useSelector((state) => state.cart.user) // Assuming user info is stored here 

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState("") // State for the currently displayed main image
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewImages, setReviewImages] = useState([])
  const [existingReview, setExistingReview] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/api/products/${id}`)
      setProduct(res.data)
      // Set initial main image to the product's main image or first other image
      setMainImage(res.data.images.main?.url || res.data.images.others?.[0]?.url || "/placeholder.svg")
      setSelectedVariantIndex(0) // Reset selected variant on product change
      setQuantity(1) // Reset quantity

      // Fetch related products
      const relatedRes = await axios.get(`${API_BASE}/api/products/related/${id}`)
      setRelatedProducts(relatedRes.data)

      // Check for existing review by current user
      if (currentUserId) {
        const userReview = res.data.reviews.find((r) => r.user === currentUserId)
        if (userReview) {
          setExistingReview(userReview)
          setReviewText(userReview.comment)
          setReviewRating(userReview.rating)
          setReviewImages(userReview.images)
        } else {
          setExistingReview(null)
          setReviewText("")
          setReviewRating(0)
          setReviewImages([])
        }
      }
    } catch (err) {
      console.error("Error fetching product:", err)
      setError("Failed to load product details. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [id, currentUserId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleThumbnailClick = (imageUrl) => {
    setMainImage(imageUrl)
  }

  const handleVariantChange = (e) => {
    setSelectedVariantIndex(Number(e.target.value))
    setQuantity(1) // Reset quantity when variant changes
  }

  const handleQuantityChange = (e) => {
    const value = Number(e.target.value)
    if (value > 0 && value <= (product.variants[selectedVariantIndex]?.stock || 0)) {
      setQuantity(value)
    } else if (value > (product.variants[selectedVariantIndex]?.stock || 0)) {
      toast.warn(`Only ${product.variants[selectedVariantIndex]?.stock} items in stock.`)
      setQuantity(product.variants[selectedVariantIndex]?.stock || 1)
    } else {
      setQuantity(1)
    }
  }

  const handleAddToCart = () => {
    if (!currentUserId) {
      toast.error("Please login to add items to cart.")
      navigate("/login_signup")
      return
    }

    if (!product || !product.variants || product.variants.length === 0) {
      toast.error("Product data is incomplete.")
      return
    }

    const selectedVariant = product.variants[selectedVariantIndex]
    if (!selectedVariant) {
      toast.error("Please select a valid product variant.")
      return
    }

    if (quantity <= 0) {
      toast.error("Quantity must be at least 1.")
      return
    }

    if (selectedVariant.stock < quantity) {
      toast.warn(`Only ${selectedVariant.stock} items of this variant are in stock.`)
      return
    }

    const itemToAdd = {
      productId: product._id,
      title: product.title,
      imageUrl: product.images.main?.url || product.images.others?.[0]?.url || "/placeholder.svg",
      variant: selectedVariant,
      quantity: quantity,
      userId: currentUserId,
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.productId === itemToAdd.productId && item.variant.size === itemToAdd.variant.size,
    )

    let updatedCartItems
    if (existingItemIndex > -1) {
      updatedCartItems = cartItems.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item,
      )
    } else {
      updatedCartItems = [...cartItems, itemToAdd]
    }

    dispatch(setCartItem(updatedCartItems))
    localStorage.setItem(`cart_${currentUserId}`, JSON.stringify(updatedCartItems))
    toast.success(`${product.title} (${selectedVariant.size}) added to cart!`)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!currentUserId) {
      toast.error("Please login to submit a review.")
      navigate("/login_signup")
      return
    }
    if (reviewRating === 0 || !reviewText.trim()) {
      toast.error("Please provide a rating and a comment.")
      return
    }

    const formData = new FormData()
    formData.append("rating", reviewRating)
    formData.append("comment", reviewText.trim())
    reviewImages.forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file)
      }
    })

    try {
      const token = localStorage.getItem("authToken")
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
      const res = await axios.post(`${API_BASE}/api/products/${id}/review`, formData, config)
      toast.success(res.data.message)
      setProduct((prev) => ({ ...prev, reviews: res.data.reviews }))
      setReviewText("")
      setReviewRating(0)
      setReviewImages([])
      setExistingReview(res.data.reviews.find((r) => r.user === currentUserId))
      const fileInput = document.getElementById("review-images")
      if (fileInput) fileInput.value = ""
    } catch (err) {
      console.error("Review submission error:", err.response?.data || err.message)
      toast.error(err.response?.data?.message || "Failed to submit review.")
    }
  }

  const handleReviewImageChange = (e) => {
    if (e.target.files) {
      setReviewImages(Array.from(e.target.files))
    }
  }

  const removeReviewImage = (index) => {
    const updatedImages = [...reviewImages]
    updatedImages.splice(index, 1)
    setReviewImages(updatedImages)
  }

  const handleReviewLikeDislike = async (reviewId, type) => {
    if (!currentUserId) {
      toast.error("Please login to like/dislike reviews.")
      navigate("/login_signup")
      return
    }
    try {
      const token = localStorage.getItem("authToken")
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      }
      const res = await axios.post(`${API_BASE}/api/products/${id}/review/${reviewId}/${type}`, {}, config)
      toast.success(res.data.message)
      setProduct((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) => (r._id === reviewId ? res.data.review : r)),
      }))
    } catch (err) {
      console.error(`Error ${type}ing review:`, err.response?.data || err.message)
      toast.error(err.response?.data?.message || `Failed to ${type} review.`)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return
    try {
      const token = localStorage.getItem("authToken")
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      }
      await axios.delete(`${API_BASE}/api/products/${id}/review/${reviewId}`, config)
      toast.success("Review deleted successfully.")
      setProduct((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r._id !== reviewId),
      }))
      setExistingReview(null)
      setReviewText("")
      setReviewRating(0)
      setReviewImages([])
      const fileInput = document.getElementById("review-images")
      if (fileInput) fileInput.value = ""
    } catch (err) {
      console.error("Error deleting review:", err.response?.data || err.message)
      toast.error(err.response?.data?.message || "Failed to delete review.")
    }
  }

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (totalRating / reviews.length).toFixed(1)
  }

  if (loading) return <div className="text-center py-10">Loading product...</div>
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>
  if (!product) return <div className="text-center py-10">Product not found.</div>

  const selectedVariant = product.variants[selectedVariantIndex]
  const finalPrice = selectedVariant
    ? (selectedVariant.price - (selectedVariant.price * (selectedVariant.discountPercent || 0)) / 100).toFixed(2)
    : "0.00"
  const originalPrice = selectedVariant ? selectedVariant.price.toFixed(2) : "0.00"
  const discountPercentage = selectedVariant ? selectedVariant.discountPercent || 0 : 0
  const stockStatus = selectedVariant?.stock > 0 ? `In Stock (${selectedVariant.stock})` : "Out of Stock"

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden md:flex">
        {/* Product Images */}
        <div className="md:w-1/2 p-4">
          <img
            src={mainImage || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-96 object-contain mb-4 rounded-lg border"
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.main?.url && (
              <img
                src={product.images.main.url || "/placeholder.svg"}
                alt="Main thumbnail"
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${mainImage === product.images.main.url ? "border-green-500" : "border-transparent"}`}
                onClick={() => handleThumbnailClick(product.images.main.url)}
              />
            )}
            {product.images.others?.map((img, index) => (
              <img
                key={index}
                src={img.url || "/placeholder.svg"}
                alt={`Thumbnail ${index + 1}`}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${mainImage === img.url ? "border-green-500" : "border-transparent"}`}
                onClick={() => handleThumbnailClick(img.url)}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          {product.productType && <p className="text-lg text-gray-600 mb-3">{product.productType}</p>}

          {/* Rating */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {Array.from({ length: Math.floor(getAverageRating(product.reviews)) }).map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>
              <span className="ml-2 text-gray-700">
                {getAverageRating(product.reviews)} ({product.reviews.length} reviews)
              </span>
            </div>
          )}

          {/* Price and Variants */}
          {product.variants && product.variants.length > 0 && (
            <>
              <div className="mb-4">
                <label htmlFor="variant-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Size/Variant:
                </label>
                <select
                  id="variant-select"
                  value={selectedVariantIndex}
                  onChange={handleVariantChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {product.variants.map((variant, index) => (
                    <option key={index} value={index}>
                      {variant.size} - ₹{variant.price}{" "}
                      {variant.discountPercent > 0 && `(${variant.discountPercent}% OFF)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-baseline mb-4">
                <span className="text-green-600 font-bold text-3xl">₹{finalPrice}</span>
                {discountPercentage > 0 && (
                  <>
                    <span className="text-gray-400 line-through ml-3 text-xl">₹{originalPrice}</span>
                    <span className="text-red-500 ml-3 text-lg font-semibold">{discountPercentage}% OFF</span>
                  </>
                )}
              </div>

              <p
                className={`text-sm font-medium ${selectedVariant?.stock > 0 ? "text-green-600" : "text-red-600"} mb-4`}
              >
                {stockStatus}
              </p>
            </>
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            <label htmlFor="quantity" className="text-lg font-medium">
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-20 p-2 border border-gray-300 rounded-md text-center"
              disabled={selectedVariant?.stock === 0}
            />
            <button
              onClick={handleAddToCart}
              className="bg-green-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedVariant?.stock === 0}
            >
              Add to Cart
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Product Details (Key-Value Pairs) */}
          {product.details && Object.keys(product.details).length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Product Specifications</h3>
              <ul className="list-disc list-inside text-gray-700">
                {Object.entries(product.details).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10 bg-white shadow-lg rounded-lg p-4 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {/* Review Submission Form */}
        <div className="mb-8 border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">{existingReview ? "Edit Your Review" : "Write a Review"}</h3>
          <form onSubmit={handleReviewSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating:</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`cursor-pointer text-3xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}
                    onClick={() => setReviewRating(star)}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment:
              </label>
              <textarea
                id="review-comment"
                rows="4"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts on this product..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="review-images" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Optional, Max 5):
              </label>
              <input
                id="review-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleReviewImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {reviewImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {reviewImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img instanceof File ? URL.createObjectURL(img) : img}
                        alt={`Review image ${index}`}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors"
              >
                {existingReview ? "Update Review" : "Submit Review"}
              </button>
              {existingReview && (
                <button
                  type="button"
                  onClick={() => handleDeleteReview(existingReview._id)}
                  className="bg-red-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Review
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List of Reviews */}
        {product.reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review._id} className="border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center mb-2">
                  <p className="font-semibold mr-2">{review.name}</p>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </div>
                  <span className="ml-auto text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {review.images.map((img, index) => (
                      <img
                        key={index}
                        src={`${API_BASE}${img}`}
                        alt={`Review image ${index}`}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <button
                    onClick={() => handleReviewLikeDislike(review._id, "like")}
                    className={`flex items-center gap-1 ${review.likes.includes(currentUserId) ? "text-green-600" : "hover:text-green-600"}`}
                  >
                    {review.likes.includes(currentUserId) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                    {review.likes.length} Like
                  </button>
                  <button
                    onClick={() => handleReviewLikeDislike(review._id, "dislike")}
                    className={`flex items-center gap-1 ${review.dislikes.includes(currentUserId) ? "text-red-600" : "hover:text-red-600"}`}
                  >
                    {review.dislikes.includes(currentUserId) ? <FaThumbsDown /> : <FaRegThumbsDown />}
                    {review.dislikes.length} Dislike
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <Link to={`/product/${relatedProduct._id}`}>
                  <img
                    src={
                      relatedProduct.images.main?.url ||
                      relatedProduct.images.others?.[0]?.url ||
                      "/placeholder.svg?height=200&width=200&text=Related Product" ||
                      "/placeholder.svg"
                    }
                    alt={relatedProduct.title}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{relatedProduct.title}</h3>
                  {relatedProduct.productType && (
                    <p className="text-sm text-gray-500 mb-2">{relatedProduct.productType}</p>
                  )}
                  {relatedProduct.reviews && relatedProduct.reviews.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <FaStar className="text-yellow-400 mr-1" />
                      <span>
                        {getAverageRating(relatedProduct.reviews)} ({relatedProduct.reviews.length} reviews)
                      </span>
                    </div>
                  )}
                  {relatedProduct.variants && relatedProduct.variants.length > 0 && (
                    <div className="flex items-baseline mb-2">
                      <span className="text-green-600 font-bold text-xl">
                        ₹
                        {Number(
                          relatedProduct.variants[0].price -
                            (relatedProduct.variants[0].price * (relatedProduct.variants[0].discountPercent || 0)) /
                              100,
                        ).toFixed(0)}
                      </span>
                      {relatedProduct.variants[0].discountPercent > 0 && (
                        <>
                          <span className="text-gray-400 line-through ml-2">
                            ₹{Number(relatedProduct.variants[0].price).toFixed(0)}
                          </span>
                          <span className="text-red-500 ml-2 text-sm font-medium">
                            {relatedProduct.variants[0].discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleAddToCart(relatedProduct, relatedProduct.variants[0])}
                    className="mt-3 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Add to Cart
                  </button>
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
