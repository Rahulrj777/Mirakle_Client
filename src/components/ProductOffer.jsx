import { useEffect, useState } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"

const OfferPage = () => {
  const [offers, setOffers] = useState([])

  useEffect(() => {
    axios.get(`${API_BASE}/api/offer-banners`)
      .then(res => setOffers(res.data))
      .catch(err => console.error("Failed to load offer banners:", err))
  }, [])

  return (
    <div className="w-[85%] mx-auto py-10 flex flex-col lg:flex-row gap-18 mt-5">
      {offers.slice(0, 2).map((offer, idx) => (
        <div
          key={offer._id}
          className={`flex-1 ${idx % 2 === 0 ? "bg-yellow-100" : "bg-gray-100"} rounded-xl p-6 flex flex-col justify-between items-start relative overflow-visible`}
        >
          {/* Percentage Badge */}
          {offer.percentage && (
            <div className={`absolute -top-14 -left-8 z-20`}>
              <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold">
                {offer.percentage}
              </div>
            </div>
          )}

          {/* Title and Button */}
          <div className="mt-20">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{offer.title}</h2>
            <button className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
              Shop Now
            </button>
          </div>

          {/* Image */}
          <div className="absolute bottom-4 right-4 h-28 md:h-36 lg:h-44">
            <img
              src={`${API_BASE}/${offer.imageUrl}`}
              alt={offer.title}
              className="h-full object-contain"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default OfferPage
