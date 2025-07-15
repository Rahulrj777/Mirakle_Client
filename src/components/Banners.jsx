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

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <input
          type="text"
          placeholder="Search the product..."
          className="w-full px-4 py-1 rounded-full bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
    </div>
  )
}

export default HeroSection
