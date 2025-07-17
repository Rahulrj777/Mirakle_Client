"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom" // Removed useLocation
import axios from "axios"
import { API_BASE } from "../utils/api"

const ProductOffer = () => {
  const [sideImages, setSideImages] = useState([])
  const [offerImages, setOfferImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  // Removed useLocation as it's no longer needed for category filtering here

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("🔄 Fetching banners from:", `${API_BASE}/api/banners`)

        const res = await axios.get(`${API_BASE}/api/banners`, {
          timeout: 15000, // Increased timeout for production server
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("✅ Banners response:", res.data)

        const allBanners = Array.isArray(res.data) ? res.data : res.data.banners || []
        const side = allBanners.filter((img) => img.type === "side")
        const offers = allBanners.filter((img) => img.type === "offer")

        setSideImages(side)
        setOfferImages(offers)

        console.log(`✅ Loaded ${side.length} side banners and ${offers.length} offer banners`)
      } catch (err) {
        console.error("❌ Banner fetch failed:", err)
        setError(err.response?.data?.message || err.message || "Failed to load banners")

        // Set empty arrays as fallback
        setSideImages([])
        setOfferImages([])
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, []) // No dependency on location.search anymore

  if (loading) {
    return (
      <div className="w-[90%] mx-auto py-12 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-gray-200 rounded-xl animate-pulse h-64">
          <div className="p-4">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/3 bg-gray-200 rounded-xl animate-pulse h-64">
          <div className="p-4">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-[90%] mx-auto py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Failed to Load Banners</h3>
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <p className="text-gray-500 text-xs mb-4">API: {API_BASE}/api/banners</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[90%] mx-auto py-12 flex flex-col lg:flex-row gap-8">
      {/* Left: Side Images - Top Selling Products */}
      <div className="flex-1 flex flex-col justify-between bg-white rounded-xl shadow-md p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🌟 Most Selling Products</h2>

        {sideImages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">No featured products available</p>
            <p className="text-sm mt-2">Featured products will appear here once added</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {sideImages.slice(0, 3).map((banner, i) => (
              <div
                key={banner._id}
                className="w-full md:w-[48%] lg:w-[30%] rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer relative"
                onClick={() => {
                  const productId = typeof banner.productId === "object" ? banner.productId._id : banner.productId
                  if (productId) {
                    navigate(`/product/${productId}`)
                  } else {
                    navigate("/shop/allproduct")
                  }
                }}
              >
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={`${API_BASE}${banner.imageUrl || banner.productImageUrl}?v=${banner._id}`}
                    alt={banner.title || `Best Seller ${i + 1}`}
                    className="w-full h-[200px] object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                  {/* Discount Badge */}
                  {banner.discountPercent > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      {banner.discountPercent}% OFF
                    </span>
                  )}
                </div>
                {/* Product Details */}
                {banner.title && (
                  <div className="p-3 bg-white">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{banner.title}</h3>
                    {/* Price Section */}
                    {banner.price > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-600 font-bold text-lg">
                          ₹{Number.parseFloat(banner.price).toFixed(0)}
                        </span>
                        {banner.oldPrice > 0 && (
                          <span className="text-gray-400 line-through text-sm">
                            ₹{Number.parseFloat(banner.oldPrice).toFixed(0)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Weight */}
                    {banner.weight?.value > 0 && (
                      <div className="text-gray-500 text-xs">
                        {banner.weight.value} {banner.weight.unit}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Offer Image */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between bg-green-50 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">🎁 Offer Zone</h2>

        {offerImages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">No offers available</p>
            <p className="text-sm mt-2">Special offers will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {offerImages.slice(0, 1).map((banner, i) => (
              <div
                key={banner._id}
                className="rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate("/shop/offerproduct")}
              >
                <img
                  src={`${API_BASE}${banner.imageUrl}?v=${banner._id}`}
                  alt={banner.title || `Offer ${i + 1}`}
                  className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=280&width=400"
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductOffer
