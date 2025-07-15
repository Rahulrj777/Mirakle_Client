import React from 'react'
import logo from "../assets/logo.png"
import { Link } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import Banner from '../assets/banner.png'
import BannerType1 from '../assets/bannerType1.jpg'
import BannerType2 from '../assets/bannerType2.jpg'
import BannerType3 from '../assets/bannerType3.jpg'

const Banners = () => {
  return (
    <div className="">
       <div className=" absolute w-full top-0 left-0 z-50 px-10 py-4 flex items-center justify-between bg-transparent text-white backdrop-blur-md">
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

        <div className="relative flex gap-4 mt-28 px-6">
          {/* Left side: Main big banner */}
          <div className="w-[70%] h-[420px]">
            <img
              src={Banner}
              alt="Main Banner"
              className="w-full h-full object-cover rounded-xl shadow-md"
            />
          </div>

          {/* Right side: Smaller 3 stacked banners */}
          <div className="w-[30%] flex flex-col gap-4">
            {[BannerType1, BannerType2, BannerType3].map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Banner ${i + 1}`}
                className="w-full h-[120px] object-cover rounded-xl shadow"
              />
            ))}
          </div>
        </div>
    </div>
  )
}

export default Banners
