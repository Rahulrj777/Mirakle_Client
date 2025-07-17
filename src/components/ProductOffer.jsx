import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../utils/api"
import specialoffer from "../assets/specialoffer.jpg"

const OfferPage = () => {

  return (
    <div class="w-[90%] mx-auto py-10 flex flex-col lg:flex-row gap-6">
      <div class="flex-1 bg-yellow-100 rounded-xl p-6 flex flex-col justify-between items-start relative overflow-hidden">
        <div class="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
          SPECIAL OFFER
        </div>
        <div class="absolute top-10 left-4 bg-yellow-500 text-black font-bold text-lg px-4 py-2 rounded shadow">
          50% OFF
        </div>

        {/* <!-- Product Info --> */}
        <div class="mt-20">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">Olive oil up to 50% offer</h2>
          <button class="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
            Shop Now
          </button>
        </div>

        {/* <!-- Image --> */}
        <div class="absolute bottom-0 right-4 h-32 md:h-40 lg:h-48">
          <img
            src="https://cdn.pixabay.com/photo/2014/04/02/10/56/olive-oil-307213_960_720.png"
            alt="Olive Oil"
            class="h-full object-contain"
          />
        </div>
      </div>

      {/* <!-- Right Banner --> */}
      <div class="flex-1 bg-gray-100 rounded-xl p-6 flex flex-col justify-between items-start relative overflow-hidden">
        {/* <!-- Special Offer Badge --> */}
        <div class="absolute top-4 left-4 w-[100px] h-[60px] rounded object-cover">
          <img src={specialoffer} alt="" />
        </div>

        {/* <!-- Product Info --> */}
        <div class="mt-20">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">Oil Products</h2>
          <button class="mt-3 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition">
            Shop Now
          </button>
        </div>

        {/* <!-- Image --> */}
        <div class="absolute bottom-0 right-2 h-32 md:h-40 lg:h-48 flex items-end">
          <img
            src="https://cdn.pixabay.com/photo/2014/10/23/18/05/olive-oil-500508_960_720.png"
            alt="Oil Products"
            class="h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}

export default OfferPage
