import React from "react"
import { Link } from "react-router-dom"
import logo from "../assets/logo.png"
import banner from "../assets/banner.png"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { FaArrowDown } from "react-icons/fa"

const HeroSection = () => {
  const scrollToNext = () => {
    const next = document.getElementById("next-section")
    if (next) next.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative w-full h-screen">
      {/* Banner background */}
      <img
        src={banner}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover brightness-95"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* Top Navigation */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between text-white">
        <img src={logo} alt="Logo" className="w-[120px] object-contain" />
        <ul className="flex gap-6 font-medium text-lg">
          {[
            { path: "/", list: "Home" },
            { path: "/shop/allproduct", list: "Shop" },
            { path: "/About_Us", list: "About Us" },
            { path: "/Contect_Us", list: "Contact Us" },
          ].map((item) => (
            <li key={item.path}>
              <Link to={item.path} className="hover:text-green-300 transition">
                {item.list}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex gap-4 text-2xl">
          <FaRegUser className="cursor-pointer hover:text-green-300" />
          <HiOutlineShoppingBag className="cursor-pointer hover:text-green-300" />
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center h-full px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Shoppable content explained</h1>
        <p className="text-lg md:text-xl max-w-2xl mb-6">
          Choosing packaging with care – discover our premium product range
        </p>
        <Link
          to="/shop/allproduct"
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-full text-white text-lg transition"
        >
          Shop Now
        </Link>

        {/* Scroll Down Arrow */}
        <FaArrowDown
          onClick={scrollToNext}
          className="mt-10 text-white text-2xl animate-bounce cursor-pointer"
        />
      </div>
    </div>
  )
}

export default HeroSection
