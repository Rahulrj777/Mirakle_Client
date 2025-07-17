import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"

const OfferPage = () => {
  const [offers, setOffers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/offer-banners`)
        setOffers(res.data)
      } catch (err) {
        console.error("Failed to load offers", err)
      }
    }
    fetchOffers()
  }, [])

  return (
    <div className="w-[90%] mx-auto py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map((offer) => (
        <div
          key={offer._id}
          className="cursor-pointer shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition"
          onClick={() => navigate(offer.route)}
        >
          <img
            src={`${API_BASE}${offer.imageUrl}`}
            alt="Offer"
            className="w-full h-[250px] object-cover hover:scale-105 transition-transform duration-300"
          />
          {offer.text && (
            <div className="p-4 bg-white text-center">
              <p className="text-sm text-gray-700">{offer.text}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default OfferPage
