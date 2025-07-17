import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"
import specialoffer from "../assets/specialoffer.png"
import discount50 from "../assets/discount50.png"

const OfferPage = () => {

  return (
    <div class="w-[90%] mx-auto py-10 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-yellow-100 rounded-xl p-6 flex flex-col justify-between items-start relative overflow-hidden">
        {/* Discount Badge Overlay */}
        <div className="absolute -top-10 -left-4 w-20 h-20 md:w-24 md:h-24">
          <img src={discount50} alt="50% Off" className="w-full h-full object-contain" />
        </div>

        {/* Product Info */}
        <div className="mt-20">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Olive oil up to 50% offer
          </h2>
          <button className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
            Shop Now
          </button>
        </div>

        {/* Olive Oil Image */}
        <div className="absolute bottom-0 right-4 h-32 md:h-40 lg:h-48">
          <img
            src="https://cdn.pixabay.com/photo/2014/04/02/10/56/olive-oil-307213_960_720.png"
            alt="Olive Oil"
            className="h-full object-contain"
          />
        </div>
      </div>

      {/* <!-- Right Banner --> */}
      <div className="flex-1 bg-gray-100 rounded-xl p-6 flex flex-col justify-between items-start relative overflow-visible">
        {/* Special Offer Badge - floating outside */}
        <div className="absolute -top-10 -left-8 z-20 w-[230px]">
          <img
            src={specialoffer}
            alt="Special Offer"
            className="w-full object-contain drop-shadow-md"
          />
        </div>

        {/* Product Info */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oil Products</h2>
          <button className="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
            Shop Now
          </button>
        </div>

        {/* Product Image */}
        <div className="absolute bottom-0 right-2 h-32 md:h-40 lg:h-48 flex items-end z-10">
          <img
            src="https://cdn.pixabay.com/photo/2014/10/23/18/05/olive-oil-500508_960_720.png"
            alt="Oil Products"
            className="h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

export default OfferPage
