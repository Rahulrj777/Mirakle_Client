import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FaArrowUp } from "react-icons/fa"
import logo from "../assets/logo.png"
import banner from "../assets/banner.png"
import Oil from "../assets/bannerType1.jpg"
import Seasoning from "../assets/bannerType2.jpg"
import Sauce from "../assets/bannerType3.jpg"

const HeroSection = () => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 w-full z-30 px-10 py-4 flex items-center justify-between text-white">
        {/* Logo */}
        <img src={logo} alt="Logo" className="w-[120px] object-contain" />

        {/* Navigation Links */}
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

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <input
            type="text"
            placeholder="Search the product..."
            className="w-full px-4 py-1 rounded-full bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* Main Banner and Right Stacked Images */}
      <div className="flex flex-col md:flex-row absolute items-stretch pt-20 md:pt-32 px-6 gap-4">
        {/* Left side: Main banner */}
        <div className="w-full md:w-[70%] h-[420px] rounded-xl overflow-hidden shadow-lg">
          <img
            src={banner}
            alt="Main Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side: 3 stacked banners */}
        <div className="w-full md:w-[30%] flex flex-col gap-4">
          {[{ img: Oil, label: "Oil Product" }, { img: Seasoning, label: "Seasoning" }, { img: Sauce, label: "Sauce" }].map((item, i) => (
            <div key={i} className="h-[130px] rounded-xl overflow-hidden shadow-md">
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-3 bg-black/50 px-2 py-1 rounded text-white text-sm font-semibold">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-opacity animate-bounce"
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  )
}

export default HeroSection
