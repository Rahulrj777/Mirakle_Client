import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"

const ProductType = () => {
  const [productTypes, setProductTypes] = useState([])
  const swiperRef = useRef(null)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/banners?type=product-type`)
        setProductTypes(res.data)
      } catch (err) {
        console.error("Failed to fetch product-type banners:", err.message)
        setProductTypes([])
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
  }, [productTypes]) // Re-run effect if productTypes change

  const handleProductTypeClick = (item) => {
    if (item.linkedUrl) {
      window.open(item.linkedUrl, "_blank")
    } else if (item.productId) {
      // Navigate to product detail page
      const productId = typeof item.productId === "object" ? item.productId._id : item.productId
      navigate(`/product/${productId}`)
    } else if (item.title) {
      // Navigate to shop page filtered by category (productType title)
      navigate(`/shop/allproduct?category=${encodeURIComponent(item.title)}`)
    } else {
      // Fallback to all products page
      navigate("/shop/allproduct")
    }
  }

  return (
    <div className="w-full py-10 bg-white overflow-hidden relative">
      <div className="w-full max-w-[1200px] mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800">Our Special Product Types</h2>
        <p className="text-center text-gray-500 mb-6">
          Explore the diverse types of spices and ingredients we offer below.
        </p>
        {productTypes.length > 0 && (
          <div ref={wrapperRef}>
            <Swiper
              ref={swiperRef}
              modules={[Autoplay, Navigation]}
              loop={productTypes.length > 1}
              slidesPerView={1}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              navigation={{
                nextEl: ".custom-next",
                prevEl: ".custom-prev",
              }}
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 10 },
                640: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 5, spaceBetween: 30 },
              }}
              className="relative"
            >
              {productTypes.map((item, i) => (
                <SwiperSlide key={item._id}>
                  <div
                    className="p-4 rounded-lg shadow-md text-center border h-full flex flex-col justify-between cursor-pointer "
                    onClick={() => handleProductTypeClick(item)}
                  >
                    <div className="relative w-full h-[150px] mb-2">
                      <img
                        key={`${item._id}-${i}`}
                        src={item.imageUrl || "/placeholder.svg?height=150&width=150&text=Product Type Image"} 
                        alt={item.title || "Product"}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain hover:scale-115 transition-transform duration-300"
                      />
                      {item.discountPercent > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                          {item.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium mb-1">
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-green-600 mr-1">₹ {Number.parseFloat(item.price).toFixed(0)}</span>
                          {item.oldPrice > item.price && (
                            <span className="text-gray-400 line-through text-xs">
                              ₹ {Number.parseFloat(item.oldPrice).toFixed(0)}
                            </span>
                          )}
                        </div>
                        {item.weight?.value > 0 && item.weight?.unit && (
                          <div className="text-gray-500 text-xs">
                            {item.weight.value} {item.weight.unit}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.title && (
                      <p className="text-gray-700 text-sm truncate w-full" title={item.title}>
                        {item.title}
                      </p>
                    )}
                  </div>
                </SwiperSlide>
              ))}
              {/* Navigation Arrows */}
              <div className="custom-prev absolute left-0 top-[40%] z-10 cursor-pointer bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md">
                &#10094;
              </div>
              <div className="custom-next absolute right-0 top-[40%] z-10 cursor-pointer bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md">
                &#10095;
              </div>
            </Swiper>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductType
