import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"

const ProductOffer = () => {
  const [offerBanners, setOfferBanners] = useState([])
  const swiperRef = useRef(null)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/offer-banners`)
        setOfferBanners(res.data)
      } catch (err) {
        console.error("Failed to fetch offer banners:", err.message)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const node = wrapperRef.current
    const swiperInstance = swiperRef.current?.swiper
    if (!node || !swiperInstance) return

    const handleMouseEnter = () => swiperInstance?.autoplay?.stop()
    const handleMouseLeave = () => swiperInstance?.autoplay?.start()

    node.addEventListener("mouseenter", handleMouseEnter)
    node.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      node.removeEventListener("mouseenter", handleMouseEnter)
      node.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [offerBanners])

  const handleOfferBannerClick = (banner, e) => {
    e.stopPropagation() // Prevent click from propagating to parent elements if nested
    if (banner.linkedProductId) {
      navigate(`/product/${banner.linkedProductId}`)
    } else if (banner.linkedCategory) {
      navigate(`/shop?productType=${banner.linkedCategory}`)
    } else if (banner.linkedDiscountUpTo) {
      navigate(`/shop?discountUpTo=${banner.linkedDiscountUpTo}`)
    } else if (banner.linkedUrl) {
      window.open(banner.linkedUrl, "_blank")
    } else {
      navigate("/shop") // Default to shop page if no specific link
    }
  }

  return (
    <div className="w-full py-10 bg-white overflow-hidden relative">
      <div className="w-full max-w-[1200px] mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800">Special Offers</h2>
        <p className="text-center text-gray-500 mb-6">Don't miss out on our limited-time deals!</p>
        {offerBanners.length > 0 && (
          <div ref={wrapperRef}>
            <Swiper
              ref={swiperRef}
              modules={[Autoplay, Navigation]}
              loop={offerBanners.length > 1}
              slidesPerView={1}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              navigation={{
                nextEl: ".custom-offer-next",
                prevEl: ".custom-offer-prev",
              }}
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 10 },
                640: { slidesPerView: 2, spaceBetween: 20 },
              }}
              className="relative"
            >
              {offerBanners.map((banner) => (
                <SwiperSlide key={banner._id}>
                  <div
                    className="relative p-4 rounded-lg shadow-md text-center border h-full flex flex-col justify-between cursor-pointer"
                    onClick={(e) => handleOfferBannerClick(banner, e)}
                  >
                    <div className="relative w-full h-[200px] mb-2">
                      <img
                        src={banner.imageUrl || "/placeholder.svg"}
                        alt={banner.title || "Offer Banner"}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover rounded-md"
                      />
                      {banner.percentage > 0 && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                          {banner.percentage}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      {banner.title && <h3 className="text-lg font-semibold text-gray-800 mb-1">{banner.title}</h3>}
                      {banner.slot && <p className="text-sm text-gray-500">Slot: {banner.slot}</p>}
                      {banner.linkedProductId && (
                        <p className="text-xs text-gray-600 mt-1">
                          Linked to Product ID: {banner.linkedProductId.slice(-6)}
                        </p>
                      )}
                      {banner.linkedCategory && (
                        <p className="text-xs text-gray-600 mt-1">Linked to Category: {banner.linkedCategory}</p>
                      )}
                      {banner.linkedDiscountUpTo > 0 && (
                        <p className="text-xs text-red-500 mt-1">Up to {banner.linkedDiscountUpTo}% Discount</p>
                      )}
                      {banner.linkedUrl && (
                        <p className="text-xs text-blue-500 mt-1 truncate">Link: {banner.linkedUrl}</p>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
              {/* Navigation Arrows */}
              <div className="custom-offer-prev absolute left-0 top-[50%] -translate-y-1/2 z-10 cursor-pointer bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md">
                &#10094;
              </div>
              <div className="custom-offer-next absolute right-0 top-[50%] -translate-y-1/2 z-10 cursor-pointer bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md">
                &#10095;
              </div>
            </Swiper>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductOffer
