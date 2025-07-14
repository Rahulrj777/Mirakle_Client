import React from 'react'
import logo from "../assets/logo.png"
import { Link } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"

const Navigation = () => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow">
        <img src={logo} alt="logo" className="w-28 h-10 object-contain" />
        <div className="flex items-center gap-5 text-[24px]">
          <FaRegUser className="text-black cursor-pointer hover:text-green-600" />
          <HiOutlineShoppingBag className="text-black cursor-pointer hover:text-green-600" />
        </div>
      </div>

      <div className="bg-[rgb(119,221,119)]">
        <ul className="max-w-7xl mx-auto px-4 py-2 flex justify-center gap-6 font-semibold text-white text-lg">
          {[
            { path: "/", list: "Home" },
            { path: "/shop/allproduct", list: "Shop" },
            { path: "/About_Us", list: "About Us" },
            { path: "/Contect_Us", list: "Contact Us" },
          ].map((item) => (
            <li key={item.path} className="cursor-pointer">
              <Link to={item.path} className="hover:text-gray-200 transition-colors">
                {item.list}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative w-full max-w-xl mx-auto my-4">
        <input
          type="text"
          placeholder="Search the product..."
          className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
    </div>
  )
}

export default Navigation
