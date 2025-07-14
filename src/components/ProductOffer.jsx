import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE } from "../utils/api"

const ProductOffer = () => {
  const [sideImages, setSideImages] = useState([])
  const [offerImages, setOfferImages] = useState([])
  const navigate = useNavigate()

 useEffect(() => {
  axios
    .get(`${API_BASE}/api/banners`)
    .then((res) => {
      console.log("Banners response:", res.data)

      const allBanners = Array.isArray(res.data)
        ? res.data
        : res.data.banners || []

      const side = allBanners.filter((img) => img.type === "side")
      const offers = allBanners.filter((img) => img.type === "offer")

      setSideImages(side)
      setOfferImages(offers)
    })
    .catch((err) => console.error("Banner fetch failed:", err))
}, [])

  return (
    <div className="w-[90%] mx-auto py-12 flex flex-col lg:flex-row gap-8">
      {/* Left: Side Images - Top Selling Products */}
      <div className="flex-1 flex flex-col justify-between bg-white rounded-xl shadow-md p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🌟 Most Selling Products</h2>
        <div className="flex flex-wrap gap-4">
          {sideImages.slice(0, 3).map((banner, i) => (
            <div
              key={banner._id}
              className="w-full md:w-[48%] lg:w-[30%] rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer relative"
              onClick={() => {
                const productId =
                  typeof banner.productId === "object"
                    ? banner.productId._id
                    : banner.productId;

                if (productId) {
                  navigate(`/product/${productId}`);
                } else {
                  navigate("/shop/allproduct");
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
                      {banner.oldPrice > banner.price && (
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
      </div>

      {/* Right: Offer Image */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between bg-green-50 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">🎁 Offer Zone</h2>
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
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductOffer
