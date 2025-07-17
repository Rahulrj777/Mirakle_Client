"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { FiSearch } from "react-icons/fi"
import { API_BASE } from "../utils/api"

const ShopingPage = () => {
  const [products, setProducts] = useState([]) // Stores products fetched based on URL params (category/search)
  const [displayedProducts, setDisplayedProducts] = useState([]) // Products after local filters (offer, local search)
  const [filterType, setFilterType] = useState("all") // 'all' or 'offer'
  const [searchTerm, setSearchTerm] = useState("") // Local search input
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()

  // Function to fetch products based on URL parameters (category or search)
  const fetchProductsBasedOnUrl = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams(location.search)
    const category = params.get("category")
    const urlSearch = params.get("search") // This is the search from URL

    let apiUrl = `${API_BASE}/api/products/all-products`

    if (category) {
      apiUrl += `?productType=${encodeURIComponent(category)}`
      console.log(`Fetching products for category: ${category}`)
    } else if (urlSearch) {
      apiUrl = `${API_BASE}/api/products/search?query=${encodeURIComponent(urlSearch)}`
      console.log(`Searching products for term from URL: ${urlSearch}`)
      setSearchTerm(urlSearch) // Set local search term from URL search
    } else {
      console.log("Fetching all products (no specific URL filter)")
      setSearchTerm("") // Clear local search term if no URL search
    }

    try {
      const res = await axios.get(apiUrl)
      setProducts(res.data) // Set the base products based on URL filter
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setError(err.response?.data?.message || err.message || "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [location.search])

  // Effect to fetch products when URL search params change
  useEffect(() => {
    fetchProductsBasedOnUrl()

    // Clean up URL after 2s if it was a search param
    const params = new URLSearchParams(location.search)
    const query = params.get("search")
    if (query) {
      setTimeout(() => {
        params.delete("search")
        navigate(`${location.pathname}`, { replace: true })
      }, 2000)
    }
  }, [location.search, fetchProductsBasedOnUrl, navigate])

  // Effect to set filterType based on path (for offer products)
  useEffect(() => {
    setFilterType(location.pathname === "/shop/offerproduct" ? "offer" : "all")
  }, [location.pathname])

  // Function to apply local filters (offer, local search)
  const applyLocalFilters = useCallback(() => {
    let result = [...products] // Start with products fetched based on URL

    // Apply offer filter
    if (filterType === "offer") {
      result = result.filter((p) => p.discountPercent > 0 || p.variants?.some((v) => v.discountPercent > 0))
    }

    // Apply local search filter (if different from URL search)
    // This handles cases where user types in the search box *after* initial load
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          (p.keywords || []).some((k) => k.toLowerCase().includes(lower)) ||
          (p.description || "").toLowerCase().includes(lower),
      )
    }

    setDisplayedProducts(result)
  }, [products, filterType, searchTerm])

  // Effect to apply local filters whenever base products, filterType, or local searchTerm changes
  useEffect(() => {
    applyLocalFilters()
  }, [products, filterType, searchTerm, applyLocalFilters])

  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    try {
      // Always use the search API for suggestions
      const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`)
      setSuggestions(res.data)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    }
  }, [])

  const handleSuggestionClick = useCallback(
    (id) => {
      navigate(`/product/${id}`)
      setSearchTerm("") // Clear search term after navigating
      setSuggestions([])
    },
    [navigate],
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && searchTerm.trim()) {
        // When user presses Enter in search, apply local filter
        applyLocalFilters()
        setSuggestions([])
      }
    },
    [searchTerm, applyLocalFilters],
  )

  // Determine the current title based on URL params
  const getPageTitle = () => {
    const params = new URLSearchParams(location.search)
    const category = params.get("category")
    const urlSearch = params.get("search")

    if (category) {
      return `Products in ${category}`
    } else if (urlSearch) {
      return `Search Results for "${urlSearch}"`
    } else if (filterType === "offer") {
      return "Offer Products"
    }
    return "All Products"
  }

  if (loading) {
    return <div className="text-center py-10">Loading products...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-3 text-center">{getPageTitle()}</h1>
      {/* Filter Controls */}
      <div className="flex justify-between items-center my-8 flex-wrap gap-4 w-full">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border w-[150px] rounded"
        >
          <option value="all">All Products</option>
          <option value="offer">Offer Products</option>
        </select>
        <div className="relative w-full md:w-1/2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <FiSearch />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search product name..."
            className="pl-10 pr-4 py-2 border rounded w-full"
          />
          {searchTerm.trim() !== "" && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white shadow-md mt-1 rounded max-h-60 overflow-y-auto border">
              {suggestions.map((product) => (
                <li
                  key={product._id}
                  onClick={() => handleSuggestionClick(product._id)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {product.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {searchTerm && (
        <p className="text-sm text-gray-500 mb-2">
          Showing results for "<strong>{searchTerm}</strong>" and other products.
        </p>
      )}
      {/* Product Grid */}
      {displayedProducts.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayedProducts.map((product) => {
            const frontImage = product.images?.others?.[0] || ""
            const isOut = product.isOutOfStock
            const variant = product.variants?.[0]
            const discount = variant?.discountPercent || 0
            const originalPrice = variant?.price || 0
            const finalPrice = originalPrice - (originalPrice * discount) / 100
            return (
              <Link to={`/product/${product._id}`} key={product._id} className="block">
                <div
                  className={`relative border rounded-lg shadow transition overflow-hidden cursor-pointer ${
                    isOut ? "opacity-60" : "hover:shadow-lg"
                  }`}
                >
                  {discount > 0 && !isOut && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-5">
                      {discount}% OFF
                    </div>
                  )}
                  <img
                    src={`${API_BASE}${frontImage}`}
                    alt={product.title}
                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300 rounded-t"
                  />
                  <div className="p-3">
                    <h2 className="text-base font-semibold truncate" title={product.title}>
                      {product.title}
                    </h2>
                    {product.productType && ( // Display product type
                      <p className="text-xs text-gray-500 mt-1">Type: {product.productType}</p>
                    )}
                    {variant && (
                      <>
                        <p className="text-sm text-gray-500 mt-1">{variant.size}</p>
                        <div className="mt-2 flex gap-2 items-center">
                          {discount > 0 && (
                            <span className="text-gray-400 line-through text-sm">₹{originalPrice.toFixed(2)}</span>
                          )}
                          <span className="text-green-600 font-bold text-base">₹{finalPrice.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ShopingPage
