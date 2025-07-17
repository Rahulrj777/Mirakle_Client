import { useEffect, useState } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import specialoffer from "../assets/specialoffer.png"
import discount50 from "../assets/discount50.png"

const OfferPage = () => {
  const [offers, setOffers] = useState([])

  useEffect(() => {
    axios.get(`${API_BASE}/api/offer-banners`)
      .then(res => {
        console.log("Offers Response:", res.data)   // Debug line
        setOffers(res.data)
      })
      .catch(err => console.error("Failed to load offer banners:", err))
  }, [])

  const leftBanner = offers.find(b => b.slot === "left");
  const rightBanner = offers.find(b => b.slot === "right");
  
  return (
    <div className="w-[85%] mx-auto py-10 flex flex-col lg:flex-row gap-18 mt-5">
      {/* Left Card - Dynamic but same design */}
      {leftBanner && (
        <div className="flex-1 bg-yellow-100 rounded-xl p-6 flex flex-col justify-between items-start relative overflow-visible">
          <div className="absolute -top-14 -left-8 z-20 w-[120px]">
            <img src={discount50} alt="50% Off" className="w-full object-contain drop-shadow-md" />
          </div>

          <div className="mt-20">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {leftBanner.title}
            </h2>
            <button className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
              Shop Now
            </button>
          </div>

          <div className="absolute bottom-4 right-4 h-28 md:h-36 lg:h-44">
            <img
              src={`${API_BASE}${leftBanner.imageUrl}`}
              alt={leftBanner.title}
              className="h-full object-contain"
            />
          </div>
        </div>
      )}

      {rightBanner && (
        <div className="flex-1 bg-gray-100 rounded-xl p-6 flex flex-col justify-between items-start relative overflow-visible">
          <div className="absolute -top-12 -left-20 z-20 w-[230px]">
            <img
              src={specialoffer}
              alt="Special Offer"
              className="w-full object-contain drop-shadow-md"
            />
          </div>

          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {rightBanner.title}
            </h2>
            <button className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
              Shop Now
            </button>
          </div>

          <div className="absolute bottom-0 right-2 h-32 md:h-40 lg:h-48 flex items-end z-10">
            <img
              src={`${API_BASE}${rightBanner.imageUrl}`}
              alt={rightBanner.title}
              className="h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default OfferPage
