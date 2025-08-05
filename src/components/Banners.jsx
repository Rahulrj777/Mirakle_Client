import logo from "../assets/logo.png"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { useSelector, useDispatch } from "react-redux"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { setCartItem, setUserId, clearUser, setCartReady } from "../Redux/cartSlice"

const Banners = () => {
  // --- Your existing hooks and state ---
  const [hovered, setHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const intervalRef = useRef(null)
  const [originalImages, setOriginalImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(1)
  const sliderRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const cartItems = useSelector((state) => state.cart.items)
  const currentUserId = useSelector((state) => state.cart.userId)

  const [searchTerm, setSearchTerm] = useState("")
  const searchContainerRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))?.user || null
    } catch {
      return null
    }
  })

  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const [sideImages, setSideImages] = useState([])

  const isActive = useCallback((path) => location.pathname === path, [location.pathname])

  const extendedImages = useMemo(() => {
    if (originalImages.length < 1) return []
    const first = originalImages[0]
    const last = originalImages[originalImages.length - 1]
    return [last, ...originalImages, first]
  }, [originalImages])

  const cartCount = useMemo(() => {
    return Array.isArray(cartItems) ? cartItems.length : 0
  }, [cartItems])

  const [searchTimeout, setSearchTimeout] = useState(null)

  const handleSearchChange = useCallback(
    async (e) => {
      const value = e.target.value
      setSearchTerm(value)

      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      if (!value.trim()) {
        setSuggestions([])
        return
      }

      const timeout = setTimeout(async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`)
          setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 6) : [])
        } catch (error) {
          console.error("Error fetching suggestions:", error)
          setSuggestions([])
        }
      }, 150)
      setSearchTimeout(timeout)
    },
    [searchTimeout],
  )

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("mirakleUser"))?.user || null
      setUser(storedUser)

      if (storedUser && currentUserId && storedUser._id !== currentUserId) {
        dispatch(clearUser())
        dispatch(setUserId(storedUser._id))
        const correctCart = localStorage.getItem(`cart_${storedUser._id}`)
        if (correctCart) {
          try {
            const parsedCart = JSON.parse(correctCart)
            if (Array.isArray(parsedCart)) dispatch(setCartItem(parsedCart))
          } catch (error) {
            dispatch(setCartItem([]))
          }
        }
      }
    } catch {
      setUser(null)
    }
  }, [location.pathname, currentUserId, dispatch])

  useEffect(() => {
    const stored = localStorage.getItem("mirakleUser")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const uid = parsed?.user?._id
        if (uid) {
          dispatch(setUserId(uid))
          const userCart = localStorage.getItem(`cart_${uid}`)
          if (userCart) {
            const parsedCart = JSON.parse(userCart)
            if (Array.isArray(parsedCart)) dispatch(setCartItem(parsedCart))
          }
        }
      } catch {}
    }
  }, [dispatch])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && searchTerm.trim()) {
        navigate(`/shop/allproduct?search=${encodeURIComponent(searchTerm.trim())}`)
        setSuggestions([])
        setSearchTerm("")
      }
    },
    [searchTerm, navigate],
  )

  const handleLogout = () => {
    const userData = localStorage.getItem("mirakleUser")
    let userId = null
    if (userData) {
      try {
        userId = JSON.parse(userData)?.user?._id
      } catch {}
    }
    localStorage.removeItem("mirakleUser")
    if (userId) localStorage.removeItem(`cart_${userId}`)
    dispatch(clearUser())
    dispatch(setCartReady(false))
    navigate("/login_signup")
  }

  const handleSelectSuggestion = useCallback(
    (id) => {
      navigate(`/product/${id}`)
      setSearchTerm("")
      setSuggestions([])
    },
    [navigate],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    function handleClickOutsideSearch(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener("mousedown", handleClickOutsideSearch)
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch)
  }, [])

  const handleCartClick = useCallback(() => {
    if (!user) {
      alert("Please login to view your cart")
      navigate("/login_signup")
    } else {
      navigate("/AddToCart")
    }
  }, [user, navigate])

  const handleUserClick = useCallback(() => {
    if (user) {
      setShowDropdown((prev) => !prev)
    } else {
      navigate("/login_signup")
    }
  }, [user, navigate])

  const slideTo = useCallback(
    (index) => {
      if (isTransitioning || !sliderRef.current || extendedImages.length === 0) return
      setIsTransitioning(true)
      sliderRef.current.style.transition = "transform 0.5s ease-in-out"
      sliderRef.current.style.transform = `translateX(-${(100 / extendedImages.length) * index}%)`
      setCurrentIndex(index)
    },
    [isTransitioning, extendedImages.length],
  )

  const handleTransitionEnd = useCallback(() => {
    if (!sliderRef.current) return
    let newIndex = currentIndex
    if (currentIndex === extendedImages.length - 1) {
      newIndex = 1
    } else if (currentIndex === 0) {
      newIndex = extendedImages.length - 2
    }
    sliderRef.current.style.transition = "none"
    sliderRef.current.style.transform = `translateX(-${(100 / extendedImages.length) * newIndex}%)`
    setCurrentIndex(newIndex)
    setTimeout(() => {
      if (sliderRef.current) {
        sliderRef.current.style.transition = "transform 0.5s ease-in-out"
      }
      setIsTransitioning(false)
    }, 20)
  }, [currentIndex, extendedImages.length])

  const startAutoPlay = useCallback(() => {
    stopAutoPlay()
    intervalRef.current = setInterval(() => {
      slideTo(currentIndex + 1)
    }, 3000)
  }, [currentIndex, slideTo])

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!hovered && originalImages.length > 1) {
      startAutoPlay()
    }
    return stopAutoPlay
  }, [hovered, originalImages.length, startAutoPlay])

  const handleNext = useCallback(() => {
    if (isTransitioning) return
    slideTo(currentIndex + 1)
  }, [isTransitioning, currentIndex, slideTo])

  const handlePrev = useCallback(() => {
    if (isTransitioning) return
    slideTo(currentIndex - 1)
  }, [isTransitioning, currentIndex, slideTo])

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/banners`)
      .then((res) => {
        const banners = Array.isArray(res.data) ? res.data : res.data.banners || []
        const sliders = banners.filter((img) => img.type === "homebanner")
        const category = banners.filter((img) => img.type === "category")
        setOriginalImages(sliders)
        setSideImages(category)
      })
      .catch((err) => {
        console.error("Error fetching banners:", err)
        setOriginalImages([])
        setSideImages([])
      })
  }, [])

  // Handle click on side category banners
  const handleSideBannerClick = useCallback(
    (banner) => {
      if (banner.type === "category" && banner.title) {
        navigate(`/shop/allproduct?category=${encodeURIComponent(banner.title)}`)
      } else if (banner.productId) {
        const productId = typeof banner.productId === "object" ? banner.productId._id : banner.productId
        navigate(`/product/${productId}`)
      } else {
        navigate("/shop/allproduct")
      }
    },
    [navigate],
  )

  // --- Responsive Layout Start ---
  return (
    <div className="w-full h-full">
      {/* Desktop/Tablet Layout */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-[80%] mx-auto mt-6 px-4 flex gap-6 h-[510px]">
          <div
            className="w-full h-full relative rounded-xl overflow-hidden"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Slider */}
            <div
              ref={sliderRef}
              className="flex h-full rounded-xl overflow-hidden"
              style={{
                transform: `translateX(-${(100 / extendedImages.length) * currentIndex}%)`,
                width: `${extendedImages.length * 100}%`,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedImages.map(
                (img, i) =>
                  img && (
                    <img
                      key={`${img._id || i}-${i}`}
                      src={img.imageUrl || "/placeholder.svg"}
                      alt={img.title || `Slide ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover flex-shrink-0 rounded-xl"
                      style={{ width: `${100 / extendedImages.length}%` }}
                    />
                  ),
              )}
            </div>

            {/* Arrows */}
            {originalImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-gray-500/70 text-white p-2 rounded-full shadow hover:bg-gray-700 transition"
                >
                  <FiChevronLeft size={22} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-500/70 text-white p-2 rounded-full shadow hover:bg-gray-700 transition"
                >
                  <FiChevronRight size={22} />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {originalImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {originalImages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition duration-300 ${
                      i === currentIndex - 1 ? "bg-white" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Side banners */}
          <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-4 mt-10">
            {sideImages.map((item, i) => (
              <div
                key={item._id || i}
                className="relative w-[230px] h-[130px] mb-4 rounded-xl overflow-hidden shadow hover:shadow-md transition cursor-pointer"
                onClick={() => handleSideBannerClick(item)}
              >
                <img
                  src={item.imageUrl || "/placeholder.svg"}
                  loading="lazy"
                  alt={item.title || `Banner ${i + 1}`}
                  className="w-full h-full object-contain"
                />
                {item.title && (
                  <div className="absolute bottom-1 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {item.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden w-full p-4">
        {/* Navbar */}
        <div className="flex justify-between items-center mb-3">
          <img src={logo} alt="logo" className="w-[120px]" />
          <div className="flex gap-4 items-center text-2xl">
            <HiOutlineShoppingBag className="cursor-pointer" onClick={handleCartClick} />
            <FaRegUser className="cursor-pointer" onClick={handleUserClick} />
          </div>
        </div>

        {/* Search */}
        <div className="mb-3 relative" ref={searchContainerRef}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search the product..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          />
          {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-50 bg-white border mt-1 rounded shadow max-h-80 overflow-y-auto w-full">
              {suggestions.map((item) => (
                <li
                  key={item._id}
                  onClick={() => handleSelectSuggestion(item._id)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                >
                  <img
                    src={
                      item.images?.others?.[0]?.url ||
                      item.images?.[0]?.url ||
                      item.imageUrl ||
                      item.variants?.[0]?.images?.[0]?.url ||
                      item.variants?.[0]?.imageUrl ||
                      "/placeholder.svg"
                    }
                    alt={item.title || "Product image"}
                    loading="lazy"
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.title}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {searchTerm.trim() && suggestions.length === 0 && (
            <div className="absolute top-full left-0 z-50 bg-white border mt-1 rounded shadow w-full p-3 text-sm text-gray-500">
              No products found for "{searchTerm}".
            </div>
          )}
        </div>

        {/* Banner slider */}
        <div
          className="w-full h-[180px] relative rounded-xl overflow-hidden mb-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            ref={sliderRef}
            className="flex h-full rounded-xl overflow-hidden"
            style={{
              transform: `translateX(-${(100 / extendedImages.length) * currentIndex}%)`,
              width: `${extendedImages.length * 100}%`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedImages.map(
              (img, i) =>
                img && (
                  <img
                    key={`${img._id || i}-${i}`}
                    src={img.imageUrl || "/placeholder.svg"}
                    alt={img.title || `Slide ${i + 1}`}
                    className="w-full h-full object-cover flex-shrink-0"
                    style={{ width: `${100 / extendedImages.length}%` }}
                  />
                ),
            )}
          </div>
        </div>

        {/* Side banners stacked */}
        <div className="flex flex-col gap-3 mt-2">
          {sideImages.map((item, i) => (
            <div
              key={item._id || i}
              className="w-full h-[120px] rounded-xl overflow-hidden shadow cursor-pointer"
              onClick={() => handleSideBannerClick(item)}
            >
              <img src={item.imageUrl || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Banners
