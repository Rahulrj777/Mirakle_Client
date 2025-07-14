import React from "react"
import logo from "../assets/logo.png"
import { Link } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"

const Navigation = () => {
  return (
    <div className="w-full absolute top-0 left-0 z-50 px-10 py-4 flex items-center justify-between bg-transparent text-white">
      {/* Logo */}
      <img src={logo} alt="logo" className="w-[120px] h-auto object-contain" />

      {/* Navigation Links */}
      <ul className="flex items-center gap-6 font-medium text-lg">
        {[
          { path: "/", list: "Home" },
          { path: "/shop/allproduct", list: "Shop" },
          { path: "/About_Us", list: "About Us" },
          { path: "/Contect_Us", list: "Contact Us" },
        ].map((item) => (
          <li key={item.path}>
            <Link to={item.path} className="hover:text-green-200 transition-colors">
              {item.list}
            </Link>
          </li>
        ))}
      </ul>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <input
          type="text"
          placeholder="Search the product..."
          className="w-full px-4 py-1 rounded-full bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-5 text-2xl">
        <FaRegUser className="cursor-pointer hover:text-green-300" />
        <HiOutlineShoppingBag className="cursor-pointer hover:text-green-300" />
      </div>
    </div>
  )
}

export default Navigation
