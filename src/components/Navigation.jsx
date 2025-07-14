import React from 'react'
import logo from "../assets/logo.png"
import { Link } from "react-router-dom";



const Navigation = () => {
  return (
    <div>
        <img src={logo} alt="logo" className="w-25 h-10 object-contain" />
        <div className="bg-[rgb(119,221,119)]">
            <ul className="max-w-7xl mx-auto px-4 py-2 flex justify-center gap-6 font-semibold text-white text-lg">
            {[
                { path: "/", list: "Home" },
                { path: "/shop/allproduct", list: "Shop" },
                { path: "/About_Us", list: "About Us" },
                { path: "/Contect_Us", list: "Contact Us" },
            ].map((item) => (
                <li key={item.path} className="cursor-pointer flex flex-col items-center">
                <Link
                    to={item.path}
                    className={`hover:text-gray-200 transition-colors ${isActive(item.path) ? "text-white font-bold" : "text-white"}`}
                >
                    {item.list}
                </Link>
                {isActive(item.path) && <hr className="mt-[4px] w-full h-[3px] bg-white rounded-[10px] border-none" />}
                </li>
            ))}
            </ul>
        </div>
        <div className="relative w-full max-w-full mx-4">
            <input
            type="text"
            placeholder="Search the product..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
        </div>
        <div className="flex items-center gap-5 text-[24px] relative">
            <span className="cursor-pointer hover:text-green-600 transition-colors">
                <FaRegUser className="text-black" />
            </span>
            <span className="relative cursor-pointer">
                <HiOutlineShoppingBag className="text-black hover:text-green-600 transition-colors" />
            </span>
        </div>
    </div>
  ) 
}

export default Navigation
