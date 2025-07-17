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
          {/* Badge Image or Text */}
          {offer.percentageImage ? (
            <div className={`absolute -top-14 -left-8 z-20 w-[120px]`}>
              <img
                src={`${API_BASE}/${offer.percentageImage}`}
                alt="Offer Badge"
                className="w-full object-contain drop-shadow-md"
              />
            </div>
          ) : offer.percentage ? (
            <div className="absolute -top-14 -left-8 z-20">
              <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold">
                {offer.percentage}
              </div>
            </div>
          ) : null}

          {/* Title and Paragraph */}
          <div className="mt-20">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{offer.title}</h2>
            {offer.description && (
              <p className="text-gray-600 mb-3">{offer.description}</p>
            )}
            <button className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
              Shop Now
            </button>
          </div>

          {/* Main Image - Olive oil or Oil products */}
          <div className={`absolute ${idx === 0 ? "bottom-4 right-4 h-28 md:h-36 lg:h-44" : "bottom-0 right-2 h-32 md:h-40 lg:h-48"} flex items-end`}>
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
