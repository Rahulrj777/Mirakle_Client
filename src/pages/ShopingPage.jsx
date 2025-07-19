"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { Link, useLocation } from "react-router-dom"
import { FaStar } from "react-icons/fa"
import { useSelector, useDispatch } from "react-redux"
import { setCartItem } from "../Redux/cartSlice"

const ShopingPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    minDiscount: "",
    maxDiscount: "",
    minRating: "",
    sortBy: "createdAt", // Default sort by newest
    sortOrder: "-1", // Default descending
    search: "",
  })
  const location = useLocation()
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items) || []
  const currentUserId = useSelector((state) => state.cart.userId)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams(location.search)
      const categoryFromUrl = queryParams.get("category") || ""
      const searchFromUrl = queryParams.get("search") || ""
      const discountUpToFromUrl = queryParams.get("discountUpTo") || ""

      setFilters((prev) => ({
        ...prev,
        category: categoryFromUrl,
        search: searchFromUrl,
        maxDiscount: discountUpToFromUrl || prev.maxDiscount, // Set maxDiscount if from URL
      }))

      const params = {
        ...filters,
        category: categoryFromUrl || filters.category, // Prioritize URL category
        search: searchFromUrl || filters.search, // Prioritize URL search
        maxDiscount: discountUpToFromUrl || filters.maxDiscount, // Prioritize URL discount
      }

      const res = await axios.get(`${API_BASE}/api/products/all-products`, { params })
      setProducts(res.data)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [filters, location.search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddToCart = (product, selectedVariant) => {
    if (!currentUserId) {
      alert("Please login to add items to cart.")
      return
    }

    const itemToAdd = {
      productId: product._id,
      title: product.title,
      imageUrl: product.images.main?.url || product.images.others?.[0]?.url || "/placeholder.svg",
      variant: selectedVariant,
      quantity: 1,
      userId: currentUserId,
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.productId === itemToAdd.productId && item.variant.size === itemToAdd.variant.size,
    )

    let updatedCartItems
    if (existingItemIndex > -1) {
      updatedCartItems = cartItems.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item,
      )
    } else {
      updatedCartItems = [...cartItems, itemToAdd]
    }

    dispatch(setCartItem(updatedCartItems))
    localStorage.setItem(`cart_${currentUserId}`, JSON.stringify(updatedCartItems))
    alert(`${product.title} (${selectedVariant.size}) added to cart!`)
  }

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (totalRating / reviews.length).toFixed(1)
  }

  if (loading) return <div className="text-center py-10">Loading products...</div>
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Our Products</h1>

      {/* Filters Section */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            placeholder="e.g., Spices"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
            Min Price
          </label>
          <input
            type="number"
            id="minPrice"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
            Max Price
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="minDiscount" className="block text-sm font-medium text-gray-700">
            Min Discount %
          </label>
          <input
            type="number"
            id="minDiscount"
            name="minDiscount"
            value={filters.minDiscount}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            min="0"
            max="100"
          />
        </div>
        <div>
          <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700">
            Max Discount %
          </label>
          <input
            type="number"
            id="maxDiscount"
            name="maxDiscount"
            value={filters.maxDiscount}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            min="0"
            max="100"
          />
        </div>
        <div>
          <label htmlFor="minRating" className="block text-sm font-medium text-gray-700">
            Min Rating
          </label>
          <select
            id="minRating"
            name="minRating"
            value={filters.minRating}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="">Any</option>
            <option value="1">1 Star & Up</option>
            <option value="2">2 Stars & Up</option>
            <option value="3">3 Stars & Up</option>
            <option value="4">4 Stars & Up</option>
            <option value="5">5 Stars</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="createdAt">Newest</option>
            <option value="price">Price</option>
            <option value="title">Name</option>
            <option value="discountPercent">Discount</option>
            <option value="avgRating">Average Rating</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <select
            id="sortOrder"
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="-1">Descending</option>
            <option value="1">Ascending</option>
          </select>
        </div>
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search products..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => fetchProducts()}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No products found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <Link to={`/product/${product._id}`}>
                <img
                  src={
                    product.images.main?.url ||
                    product.images.others?.[0]?.url ||
                    "/placeholder.svg?height=200&width=200&text=Product Image" ||
                    "/placeholder.svg"
                  }
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">{product.title}</h3>
                {product.productType && <p className="text-sm text-gray-500 mb-2">{product.productType}</p>}
                {product.reviews && product.reviews.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span>
                      {getAverageRating(product.reviews)} ({product.reviews.length} reviews)
                    </span>
                  </div>
                )}
                {product.variants && product.variants.length > 0 && (
                  <div className="flex items-baseline mb-2">
                    <span className="text-green-600 font-bold text-xl">
                      ₹
                      {Number(
                        product.variants[0].price -
                          (product.variants[0].price * (product.variants[0].discountPercent || 0)) / 100,
                      ).toFixed(0)}
                    </span>
                    {product.variants[0].discountPercent > 0 && (
                      <>
                        <span className="text-gray-400 line-through ml-2">
                          ₹{Number(product.variants[0].price).toFixed(0)}
                        </span>
                        <span className="text-red-500 ml-2 text-sm font-medium">
                          {product.variants[0].discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleAddToCart(product, product.variants[0])}
                  className="mt-3 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ShopingPage
