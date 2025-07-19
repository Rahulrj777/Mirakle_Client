import { useEffect, useState } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import specialoffer from "../assets/specialoffer.png"
import discount50 from "../assets/discount50.png"
import { useNavigate } from "react-router-dom"

const ProductOffer = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`${API_BASE}/api/offer-banners`)
        console.log("Offers Response:", res.data)
        setOffers(res.data)
      } catch (err) {
        console.error("Failed to load offer banners:", err)
        setError(err.response?.data?.message || err.message || "Failed to load offer banners")
        setOffers([])
      } finally {
        setLoading(false)
      }
    }
    fetchOffers()
  }, [])

  const leftBanner = offers.find((b) => b.slot === "left")
  const rightBanner = offers.find((b) => b.slot === "right")

  const handleOfferBannerClick = (banner, e) => {
    e.stopPropagation() 
    console.log("Offer banner clicked, navigating...")
    let path = "/shop/allproduct"
    const params = new URLSearchParams()

    if (banner.linkedProductId) {
      navigate(`/product/${banner.linkedProductId}`)
      return
    } else if (banner.linkedCategory) {
      params.append("category", banner.linkedCategory)
    }
    if (banner.linkedDiscountUpTo > 0) {
      params.append("discountUpTo", banner.linkedDiscountUpTo)
    }
    if (params.toString()) {
      path += `?${params.toString()}`
    }
    navigate(path)
  }

  if (loading) {
    return (
      <div className="w-[85%] mx-auto py-10 flex flex-col lg:flex-row gap-10 mt-5">
        <div className="flex-1 bg-gray-200 rounded-xl animate-pulse h-48"></div>
        <div className="flex-1 bg-gray-200 rounded-xl animate-pulse h-48"></div>
      </div>
    )
  }

  if (error) {
    return <div className="w-[85%] mx-auto py-10 text-center text-red-500">Error loading offers: {error}</div>
  }

  if (!leftBanner && !rightBanner) {
    return (
      <div className="w-[85%] mx-auto py-10 text-center text-gray-500">No special offers available at the moment.</div>
    )
  }

  return (
    <div className="w-[85%] mx-auto py-10 flex flex-col lg:flex-row gap-10 mt-5">
      {leftBanner && (
        <div className="flex-1 bg-yellow-100 rounded-xl p-6 flex flex-row items-center relative overflow-visible">
          <div className="absolute -top-14 -left-8 z-20 w-[120px]">
            <img
              src={discount50 || "/placeholder.svg"}
              alt="50% Off"
              className="w-full object-contain drop-shadow-md"
            />
          </div>
          {/* Text Section - 50% */}
          <div className="w-1/2 z-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{leftBanner.title}</h2>
            {leftBanner.percentage > 0 && (
              <p className="text-lg font-bold text-red-600 mb-2">{leftBanner.percentage}% OFF</p>
            )}
            <button 
              className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition cursor-pointer"
              onClick={(e) => handleOfferBannerClick(leftBanner, e)}
            >
              Shop Now
            </button>
          </div>
          {/* Image Section - 50% */}
          <div className="w-1/2 flex justify-end items-center">
            <img
              src={leftBanner.imageUrl || "/placeholder.svg"}
              alt={leftBanner.title}
              className="h-32 md:h-40 lg:h-48 object-contain"
            />
          </div>
        </div>
      )}
      {rightBanner && (
        <div
          className="flex-1 bg-gray-100 rounded-xl p-6 flex flex-row items-center relative overflow-visible"
           // Attach click handler and pass event
        >
          <div className="absolute -top-12 -left-20 z-20 w-[230px]">
            <img
              src={specialoffer || "/placeholder.svg"}
              alt="Special Offer"
              className="w-full object-contain drop-shadow-md"
            />
          </div>
          {/* Text Section - Special Offer */}
          <div className="w-1/2 z-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{rightBanner.title}</h2>
            {rightBanner.percentage > 0 && (
              <p className="text-lg font-bold text-red-600 mb-2">{rightBanner.percentage}% OFF</p>
            )}
            <button
              className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition cursor-pointer"
              onClick={(e) => handleOfferBannerClick(rightBanner, e)}
            >
              Shop Now
            </button>
          </div>
          {/* Image Section - Special Offer */}
          <div className="w-1/2 flex justify-end items-center">
            <img
              src={rightBanner.imageUrl || "/placeholder.svg"}
              alt={rightBanner.title}
              className="h-32 md:h-40 lg:h-48 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductOffer
