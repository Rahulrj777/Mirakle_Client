import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { setCartItem, setUserId, clearUser, setCartReady } from "../Redux/cartSlice"
import logo from "../assets/logo.png"

const Banners = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [originalImages, setOriginalImages] = useState([])
  const [sideImages, setSideImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const sliderRef = useRef(null)
  const intervalRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchContainerRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const cartItems = useSelector((state) => state.cart.items)
  const cartCount = Array.isArray(cartItems) ? cartItems.length : 0

  // ✅ Looping images for slider
  const extendedImages = useMemo(() => {
    if (originalImages.length < 1) return []
    const first = originalImages[0]
    const last = originalImages[originalImages.length - 1]
    return [last, ...originalImages, first]
  }, [originalImages])

  // ✅ Load user & sync cart
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("mirakleUser"))?.user || null
      setUser(storedUser)
      if (storedUser) {
        dispatch(setUserId(storedUser._id))
        const storedCart = localStorage.getItem(`cart_${storedUser._id}`)
        if (storedCart) dispatch(setCartItem(JSON.parse(storedCart)))
      }
    } catch {
      setUser(null)
    }
  }, [dispatch])

  // ✅ Fetch banners
  useEffect(() => {
    axios.get(`${API_BASE}/api/banners`)
      .then((res) => {
        const banners = Array.isArray(res.data) ? res.data : res.data.banners || []
        setOriginalImages(banners.filter((img) => img.type === "homebanner"))
        setSideImages(banners.filter((img) => img.type === "category"))
      })
      .catch(() => {
        setOriginalImages([])
        setSideImages([])
      })
  }, [])

  // ✅ Search logic
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!value.trim()) return setSuggestions([])

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`)
        setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 6) : [])
      } catch {
        setSuggestions([])
      }
    }, 200)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/shop/allproduct?search=${encodeURIComponent(searchTerm.trim())}`)
      setSuggestions([])
      setSearchTerm("")
    }
  }

  const handleSelectSuggestion = (id) => {
    navigate(`/product/${id}`)
    setSearchTerm("")
    setSuggestions([])
  }

  const handleLogout = () => {
    const userId = user?._id
    localStorage.removeItem("mirakleUser")
    if (userId) localStorage.removeItem(`cart_${userId}`)
    dispatch(clearUser())
    dispatch(setCartReady(false))
    navigate("/login_signup")
  }

  const handleCartClick = () => user ? navigate("/AddToCart") : navigate("/login_signup")
  const handleUserClick = () => user ? setShowDropdown((prev) => !prev) : navigate("/login_signup")
  const handleSideBannerClick = (banner) => {
    if (banner.type === "category" && banner.title) {
      navigate(`/shop/allproduct?category=${encodeURIComponent(banner.title)}`)
    } else if (banner.productId) {
      const productId = typeof banner.productId === "object" ? banner.productId._id : banner.productId
      navigate(`/product/${productId}`)
    } else {
      navigate("/shop/allproduct")
    }
  }

  // ✅ Slider functions
  const slideTo = (index) => {
    if (isTransitioning || !sliderRef.current || extendedImages.length === 0) return
    setIsTransitioning(true)
    sliderRef.current.style.transition = "transform 0.5s ease-in-out"
    sliderRef.current.style.transform = `translateX(-${(100 / extendedImages.length) * index}%)`
    setCurrentIndex(index)
  }

  const handleTransitionEnd = () => {
    if (!sliderRef.current) return
    let newIndex = currentIndex
    if (currentIndex === extendedImages.length - 1) newIndex = 1
    else if (currentIndex === 0) newIndex = extendedImages.length - 2
    sliderRef.current.style.transition = "none"
    sliderRef.current.style.transform = `translateX(-${(100 / extendedImages.length) * newIndex}%)`
    setCurrentIndex(newIndex)
    setTimeout(() => {
      if (sliderRef.current) sliderRef.current.style.transition = "transform 0.5s ease-in-out"
      setIsTransitioning(false)
    }, 20)
  }

  useEffect(() => {
    if (!hovered && originalImages.length > 1) {
      intervalRef.current = setInterval(() => slideTo(currentIndex + 1), 3000)
    }
    return () => clearInterval(intervalRef.current)
  }, [hovered, originalImages.length, currentIndex])

  return (
    <div className="w-full flex flex-col bg-white">

      {/* 🔹 Navbar */}
      <div className="w-full flex items-center justify-between px-4 py-3 border-b">
        <button className="text-2xl">☰</button>
        <img src={logo} alt="logo" className="w-[120px]" />
        <div className="flex items-center gap-4 text-xl">
          {/* User */}
          <div ref={dropdownRef} className="relative">
            {user ? (
              <div
                className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full cursor-pointer"
                onClick={handleUserClick}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <FaRegUser onClick={handleUserClick} className="cursor-pointer" />
            )}
            {showDropdown && (
              <div className="absolute top-10 right-0 bg-white shadow-lg rounded-md z-50 w-40 py-2 border">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <span className="relative cursor-pointer" onClick={handleCartClick}>
            <HiOutlineShoppingBag />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 🔹 Search */}
      <div className="p-3 relative" ref={searchContainerRef}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Search the product..."
          className="w-full px-4 py-2 border rounded-full focus:outline-none text-sm"
        />
        {searchTerm.trim() && suggestions.length > 0 && (
          <ul className="absolute top-full left-0 z-50 bg-white border mt-1 rounded shadow max-h-60 overflow-y-auto w-full">
            {suggestions.map((item) => (
              <li
                key={item._id}
                onClick={() => handleSelectSuggestion(item._id)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
              >
                <img
                  src={item.images?.[0]?.url || "/placeholder.svg"}
                  alt={item.title || "Product"}
                  className="w-8 h-8 object-cover rounded"
                />
                <div className="text-sm">{item.title}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔹 Main Slider */}
      <div
        className="w-full h-[200px] relative overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          ref={sliderRef}
          className="flex h-full"
          style={{
            transform: `translateX(-${(100 / extendedImages.length) * currentIndex}%)`,
            width: `${extendedImages.length * 100}%`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedImages.map((img, i) => (
            <img
              key={i}
              src={img?.imageUrl || "/placeholder.svg"}
              alt={img?.title || `Slide ${i + 1}`}
              className="w-full h-full object-cover flex-shrink-0"
              style={{ width: `${100 / extendedImages.length}%` }}
            />
          ))}
        </div>
        {/* Arrows */}
        {originalImages.length > 1 && (
          <>
            <button
              onClick={() => slideTo(currentIndex - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              onClick={() => slideTo(currentIndex + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1 rounded-full"
            >
              <FiChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* 🔹 Side Banners (Full width stacked) */}
      <div className="w-full mt-3 px-3 flex flex-col gap-3">
        {sideImages.map((item, i) => (
          <div
            key={i}
            className="relative w-full h-[120px] rounded-xl overflow-hidden shadow hover:shadow-md cursor-pointer"
            onClick={() => handleSideBannerClick(item)}
          >
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.title || `Banner ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {item.title && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {item.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Banners
