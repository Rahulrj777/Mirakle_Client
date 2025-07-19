"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"
import { calculateDiscountedPrice } from "../utils/shopPageUtils"

export default function ProductOffer() {
  const [offerProducts, setOfferProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOfferProducts = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/api/products/all-products`)
        // Filter products that have at least one variant with a discount
        const productsWithOffers = res.data.filter(
          (product) => product.variants && product.variants.some((variant) => variant.discountPercent > 0),
        )
        setOfferProducts(productsWithOffers)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch offer products.")
        setLoading(false)
      }
    }
    fetchOfferProducts()
  }, [])

  const handleProductClick = useCallback(
    (productId, e) => {
      e.stopPropagation() // Prevent event bubbling if nested
      navigate(`/product/${productId}`)
    },
    [navigate],
  )

  if (loading) return <div className="text-center py-8">Loading offers...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Special Offers</h1>
      {offerProducts.length === 0 && (
        <div className="text-center text-gray-600 text-lg">No special offers available at the moment.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {offerProducts.map((product) => (
          <div
            key={product._id}
            className="border rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
            onClick={(e) => handleProductClick(product._id, e)}
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
              {product.variants && product.variants.length > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-green-600">
                    ₹{calculateDiscountedPrice(product.variants[0].price, product.variants[0].discountPercent)}
                  </span>
                  {product.variants[0].discountPercent > 0 && (
                    <span className="text-sm text-gray-500 line-through">₹{product.variants[0].price.toFixed(2)}</span>
                  )}
                  {product.variants[0].discountPercent > 0 && (
                    <span className="text-sm text-red-500">({product.variants[0].discountPercent}% off)</span>
                  )}
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-600">Price N/A</span>
              )}
              {product.isOutOfStock && <span className="text-red-500 font-semibold mt-2 block">Out of Stock</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
