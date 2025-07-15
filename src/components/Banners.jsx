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

  // Show arrow when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Banner Background */}
      <img
        src={banner}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover brightness-95"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* Top Navigation */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between text-white">
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

        {/* Search */}
        <div className="flex-1 max-w-md mx-6">
          <input
            type="text"
            placeholder="Search the product..."
            className="w-full px-4 py-1 rounded-full bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* Center + Side Banners */}
      <div className="relative z-10 flex items-center justify-between h-full px-8">
        {/* Left Text Block */}
        <div className="text-white max-w-xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Shoppable content explained</h1>
          <p className="text-lg md:text-xl mb-6">
            Choosing packaging with care – discover our premium product range
          </p>
          <Link
            to="/shop/allproduct"
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-full text-white text-lg transition"
          >
            Shop Now
          </Link>
        </div>

        {/* Right Side Category Banners */}
        <div className="flex flex-col gap-4 w-[180px]">
          {[{ img: Oil, label: "Oil Product" }, { img: Seasoning, label: "Seasoning" }, { img: Sauce, label: "Sauce" }].map((item, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden shadow-lg">
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-[100px] object-cover"
              />
              <div className="absolute bottom-1 left-2 text-white text-sm font-semibold drop-shadow">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll to Top Arrow */}
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
