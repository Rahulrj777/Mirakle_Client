import React from "react"
import logo from "../assets/logo.png"
import bannerImg from "../assets/banner.png"
import { Link } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { FaArrowDown, FaArrowUp } from "react-icons/fa"

const HeroBanner = () => {
  const scrollToContent = () => {
    const content = document.getElementById("mainContent")
    if (content) content.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="relative h-[100vh] w-full overflow-hidden">
      {/* Banner Background Image */}
      <img
        src={bannerImg}
        alt="Banner"
        className="absolute inset-0 w-full h-full object-cover brightness-95"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-10" />

      {/* Navigation Inside Banner */}
      <div className="relative z-20 px-10 py-4 flex items-center justify-between text-white">
        <img src={logo} alt="logo" className="w-[120px]" />
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
        <div className="flex items-center gap-5 text-2xl">
          <FaRegUser className="cursor-pointer hover:text-green-300" />
          <HiOutlineShoppingBag className="cursor-pointer hover:text-green-300" />
        </div>
      </div>

      {/* Centered Banner Text */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Shoppable content explained</h1>
        <p className="max-w-xl text-lg md:text-xl mb-6">
          Discover, explore and shop premium products with Mirakle.
        </p>
        <button
          onClick={scrollToContent}
          className="mt-4 text-white bg-green-600 px-6 py-2 rounded-full hover:bg-green-700 transition"
        >
          Explore Now
        </button>

        {/* Scroll Down Arrow */}
        <FaArrowDown
          className="mt-10 animate-bounce cursor-pointer text-white text-2xl"
          onClick={scrollToContent}
        />
      </div>
    </div>
  )
}

export default HeroBanner
