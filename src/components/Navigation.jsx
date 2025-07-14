import React from "react"
import logo from "../assets/logo.png"
import { Link } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"

const Navigation = () => {
  return (
    <div className="w-full bg-white shadow px-6 py-3 flex items-center justify-between gap-6">
      {/* Logo */}
      <img src={logo} alt="logo" className="w-50 h-30 object-contain" />

      {/* Navigation Links */}
      <ul className="flex items-center gap-6 font-semibold text-lg text-green-700">
        {[
          { path: "/", list: "Home" },
          { path: "/shop/allproduct", list: "Shop" },
          { path: "/About_Us", list: "About Us" },
          { path: "/Contect_Us", list: "Contact Us" },
        ].map((item) => (
          <li key={item.path}>
            <Link to={item.path} className="hover:text-green-500 transition-colors">
              {item.list}
            </Link>
          </li>
        ))}
      </ul>

      {/* Search bar */}
      <div className="flex-1 max-w-md mx-4">
        <input
          type="text"
          placeholder="Search the product..."
          className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-5 text-2xl text-black">
        <FaRegUser className="cursor-pointer hover:text-green-600" />
        <HiOutlineShoppingBag className="cursor-pointer hover:text-green-600" />
      </div>
    </div>
  )
}

export default Navigation
