"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { useNavigate } from "react-router-dom"

const ProductOffer = () => {
  const [offerBanners, setOfferBanners] = useState([])
  const navigate = useNavigate()

  const fetchOfferBanners = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/offer-banners`)
      setOfferBanners(res.data)
    } catch (err) {
      console.error("Failed to fetch offer banners:", err)
      setOfferBanners([])
    }
  }, [])

  useEffect(() => {
    fetchOfferBanners()
  }, [fetchOfferBanners])

  const handleBannerClick = useCallback(
    (banner) => {
      if (banner.linkedProductId) {
        navigate(`/product/${banner.linkedProductId}`)
      } else if (banner.linkedCategory) {
        navigate(`/shop/allproduct?category=${encodeURIComponent(banner.linkedCategory)}`)
      } else if (banner.linkedDiscountUpTo) {
        navigate(`/shop/allproduct?discountUpTo=${banner.linkedDiscountUpTo}`)
      } else if (banner.linkedUrl) {
        window.open(banner.linkedUrl, "_blank")
      } else {
        navigate("/shop/allproduct")
      }
    },
    [navigate],
  )

  const leftBanner = offerBanners.find((b) => b.slot === "left")
  const rightBanner = offerBanners.find((b) => b.slot === "right")

  return (
    <div className="w-full max-w-[1200px] mx-auto py-10 px-4">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Special Offers</h2>
      <div className="flex flex-col md:flex-row gap-6">
        {leftBanner && (
          <div
            className="relative flex-1 h-[250px] rounded-xl overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => handleBannerClick(leftBanner)}
          >
            <img
              src={leftBanner.imageUrl || "/placeholder.svg"}
              alt={leftBanner.title || "Left Offer Banner"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white p-4">
              <h3 className="text-3xl font-bold text-center mb-2">{leftBanner.title}</h3>
              {leftBanner.percentage > 0 && (
                <p className="text-xl font-semibold bg-red-600 px-3 py-1 rounded-full">{leftBanner.percentage}% OFF</p>
              )}
              {leftBanner.linkedDiscountUpTo > 0 && (
                <p className="text-lg mt-1">Up to {leftBanner.linkedDiscountUpTo}% Discount</p>
              )}
            </div>
          </div>
        )}

        {rightBanner && (
          <div
            className="relative flex-1 h-[250px] rounded-xl overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => handleBannerClick(rightBanner)}
          >
            <img
              src={rightBanner.imageUrl || "/placeholder.svg"}
              alt={rightBanner.title || "Right Offer Banner"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white p-4">
              <h3 className="text-3xl font-bold text-center mb-2">{rightBanner.title}</h3>
              {rightBanner.percentage > 0 && (
                <p className="text-xl font-semibold bg-red-600 px-3 py-1 rounded-full">{rightBanner.percentage}% OFF</p>
              )}
              {rightBanner.linkedDiscountUpTo > 0 && (
                <p className="text-lg mt-1">Up to {rightBanner.linkedDiscountUpTo}% Discount</p>
              )}
            </div>
          </div>
        )}

        {!leftBanner && !rightBanner && (
          <div className="flex-1 text-center text-gray-500 py-10 border rounded-lg">
            No special offers available at the moment.
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductOffer
