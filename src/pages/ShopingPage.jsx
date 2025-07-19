"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { FiSearch } from "react-icons/fi" // Assuming you use react-icons
import { API_BASE } from "../utils/api"
import useShopProducts from "../hooks/useShopProducts" // Assuming this hook exists and is client-side
import { calculateDiscountedPrice, getShopPageTitle } from "../utils/shopPageUtils" // Import the new utility

export default function ShopingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialSearchTerm = queryParams.get("search") || ""
  const initialProductType = queryParams.get("productType") || ""

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedProductType, setSelectedProductType] = useState(initialProductType)
  const [availableProductTypes, setAvailableProductTypes] = useState([])

  // Assuming useShopProducts fetches and filters products based on searchTerm and selectedProductType
  const {
    displayedProducts: products, // Renamed from 'products' to 'displayedProducts' to avoid confusion with the hook's internal 'products' state
    loading,
    error,
    suggestions,
    handleSearchChange: hookHandleSearchChange,
    handleSuggestionClick,
    handleKeyDown,
  } = useShopProducts(searchTerm, selectedProductType)

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/all-products`)
        const uniqueTypes = [...new Set(res.data.map((p) => p.productType).filter(Boolean))].sort()
        setAvailableProductTypes(uniqueTypes)
      } catch (err) {
        console.error("Error fetching product types:", err)
      }
    }
    fetchProductTypes()
  }, [])

  useEffect(() => {
    setSearchTerm(initialSearchTerm)
    setSelectedProductType(initialProductType)
  }, [initialSearchTerm, initialProductType])

  // Override hook's handleSearchChange to also update URL
  const handleSearchChange = useCallback(
    (e) => {
      setSearchTerm(e.target.value)
      const newParams = new URLSearchParams(location.search)
      if (e.target.value) {
        newParams.set("search", e.target.value)
      } else {
        newParams.delete("search")
      }
      navigate(`?${newParams.toString()}`, { replace: true })
      hookHandleSearchChange(e) // Call the original hook's handler
    },
    [location.search, navigate, hookHandleSearchChange],
  )

  const handleProductTypeChange = useCallback(
    (e) => {
      setSelectedProductType(e.target.value)
      const newParams = new URLSearchParams(location.search)
      if (e.target.value) {
        newParams.set("productType", e.target.value)
      } else {
        newParams.delete("productType")
      }
      navigate(`?${newParams.toString()}`, { replace: true })
    },
    [location.search, navigate],
  )

  const handleProductClick = useCallback(
    (productId) => {
      navigate(`/product/${productId}`)
    },
    [navigate],
  )

  if (loading) return <div className="text-center py-8">Loading products...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">{getShopPageTitle(location, selectedProductType)}</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <FiSearch />
          </span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="p-2 border border-gray-300 rounded-md w-full pl-10"
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
        <select
          value={selectedProductType}
          onChange={handleProductTypeChange}
          className="p-2 border border-gray-300 rounded-md md:w-auto"
        >
          <option value="">All Categories</option>
          {availableProductTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {products.length === 0 && (
        <div className="text-center text-gray-600 text-lg">No products found matching your criteria.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="border rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
            onClick={() => handleProductClick(product._id)}
          >
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              {product.images?.others?.[0]?.url ? (
                <img
                  src={product.images.others[0].url || "/placeholder.svg"}
                  alt={product.title}
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
              <h2 className="text-xl font-semibold mb-2 truncate">{product.title}</h2>
              {product.productType && <p className="text-sm text-gray-600 mb-2">{product.productType}</p>}
              <div className="flex items-baseline gap-2">
                {product.variants && product.variants.length > 0 ? (
                  <>
                    <span className="text-lg font-bold text-green-600">
                      ₹{calculateDiscountedPrice(product.variants[0].price, product.variants[0].discountPercent)}
                    </span>
                    {product.variants[0].discountPercent > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.variants[0].price.toFixed(2)}
                      </span>
                    )}
                    {product.variants[0].discountPercent > 0 && (
                      <span className="text-sm text-red-500">({product.variants[0].discountPercent}% off)</span>
                    )}
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-600">Price N/A</span>
                )}
              </div>
              {product.isOutOfStock && <span className="text-red-500 font-semibold mt-2 block">Out of Stock</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
