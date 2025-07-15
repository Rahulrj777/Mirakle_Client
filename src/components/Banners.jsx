import logo from "../assets/logo.png";
import axios from "axios"
import { API_BASE } from "../utils/api"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { useSelector, useDispatch } from "react-redux"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { setCartItem, setUserId, clearUser } from "../Redux/cartSlice"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Banners = () => {
  const [hovered, setHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);
  const [originalImages, setOriginalImages] = useState([]);
  const [sliderImages, setSliderImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const sliderRef = useRef(null);
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items) || []
  const currentUserId = useSelector((state) => state.cart.userId)
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))?.user || null
    } catch {
      return null
    }
  })
  const [showDropdown, setShowDropdown] = useState(false) // ✅ Fixed: Default to false
  const dropdownRef = useRef(null)
  const [sideImages, setSideImages] = useState([])

  const isActive = useCallback((path) => location.pathname === path, [location.pathname])

  const cartCount = useMemo(() => {
    return Array.isArray(cartItems) ? cartItems.length : 0
  }, [cartItems])

  // ✅ Debounced search to improve performance
  const [searchTimeout, setSearchTimeout] = useState(null)

  const handleSearchChange = useCallback(
    async (e) => {
      const value = e.target.value
      setSearchTerm(value)

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      if (!value.trim()) {
        setSuggestions([])
        return
      }

      // Debounce search by 300ms
      const timeout = setTimeout(async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`)
          setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 6) : [])
        } catch (error) {
          console.error("Error fetching suggestions:", error)
          setSuggestions([])
        }
      }, 300)

      setSearchTimeout(timeout)
    },
    [searchTimeout],
  )

  // ✅ Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // ✅ Improved user state management
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("mirakleUser"))?.user || null
      setUser(storedUser)

      // Check for user mismatch
      if (storedUser && currentUserId && storedUser._id !== currentUserId) {
        console.log("User mismatch detected, clearing cart...")
        dispatch(clearUser())
        dispatch(setUserId(storedUser._id))

        // Load correct cart for this user
        const correctCart = localStorage.getItem(`cart_${storedUser._id}`)
        if (correctCart) {
          try {
            const parsedCart = JSON.parse(correctCart)
            if (Array.isArray(parsedCart)) {
              dispatch(setCartItem(parsedCart))
            }
          } catch (error) {
            console.error("Error loading correct cart:", error)
            dispatch(setCartItem([]))
          }
        } else {
          dispatch(setCartItem([]))
        }
      }
    } catch {
      setUser(null)
    }
  }, [location.pathname, currentUserId, dispatch])

  // ✅ Initialize user cart on mount
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
      } catch {
        console.warn("Error restoring cart from localStorage")
      }
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

  const handleLogout = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("mirakleUser"))?.user

    if (user?._id) {
      console.log(`Logging out user ${user._id}, keeping their cart in localStorage`)
    }

    // Clear user session
    localStorage.removeItem("mirakleUser")
    dispatch(clearUser())
    setShowDropdown(false) // ✅ Close dropdown on logout
    navigate("/login_signup")
  }, [dispatch, navigate])

  const handleSelectSuggestion = useCallback(
    (id) => {
      navigate(`/product/${id}`)
      setSearchTerm("")
      setSuggestions([])
    },
    [navigate],
  )

  // ✅ Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ✅ Handle cart click
  const handleCartClick = useCallback(() => {
    if (!user) {
      alert("Please login to view your cart")
      navigate("/login_signup")
    } else {
      navigate("/AddToCart")
    }
  }, [user, navigate])

  // ✅ Handle user icon click
  const handleUserClick = useCallback(() => {
    if (user) {
      setShowDropdown((prev) => !prev)
    } else {
      navigate("/login_signup")
    }
  }, [user, navigate])

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    intervalRef.current = setInterval(() => {
      slideTo(currentIndex + 1);
    }, 3000);
  }, [currentIndex]);

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!hovered && originalImages.length > 1) {
      startAutoPlay();
    }
    return stopAutoPlay;
  }, [hovered, originalImages.length, startAutoPlay]);

  const slideTo = (index) => {
    if (isTransitioning || !sliderRef.current) return;
    setIsTransitioning(true);
    sliderRef.current.style.transition = "transform 0.5s ease-in-out";
    setCurrentIndex(index);
  };

  const handleTransitionEnd = () => {
    if (!sliderRef.current) return;

    let newIndex = currentIndex;
    sliderRef.current.style.transition = "none";

    if (currentIndex === sliderImages.length - 1) {
      newIndex = 1;
    } else if (currentIndex === 0) {
      newIndex = sliderImages.length - 2;
    }

    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 20);
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    slideTo(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex >= sliderImages.length - 1) return;
    slideTo(currentIndex + 1);
  };

  useEffect(() => {
    axios.get(`${API_BASE}/api/banners`).then((res) => {
      const banners = Array.isArray(res.data) ? res.data : res.data.banners || [];
      const main = banners.filter((img) => img.type === "main");
      const side = banners.filter((img) => img.type === "side");

      setOriginalImages(main);
      setSideImages(side);

      if (main.length) {
        const first = main[0];
        const last = main[main.length - 1];
        setSliderImages([last, ...main, first]);
        setCurrentIndex(1);
      }
    });
  }, []);

  useEffect(() => {
  const handler = (e) => {
    if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
      setSuggestions([]);
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);










  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden flex gap-4 mt-6 max-w-7xl mx-auto">
      <div className="">
        <div
          className=" max-w-7xl mx-auto mt-6 w-[75%] relative overflow-hidden h-[370px] rounded-xl"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Slider */}
          <div
            ref={sliderRef}
            className="flex h-full"
            style={{
              width: `${sliderImages.length * 100}%`,
              transform: `translateX(-${(100 / sliderImages.length) * currentIndex}%)`,
              transition: isTransitioning ? "transform 0.5s ease-in-out" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {sliderImages.map((img, i) => (
              <img
                key={`${img._id || i}-${i}`}
                src={`${API_BASE}${img.imageUrl}?v=${img._id}`}
                alt={img.title || `Slide ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover flex-shrink-0"
                style={{ width: `${100 / sliderImages.length}%` }}
              />
            ))}
          </div>

          {/* Arrows */}
          {sliderImages.length > 1 && (
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
                  className={`w-3 h-3 rounded-full transition ${
                    i === currentIndex - 1 ? "bg-white" : "bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="absolute top-0 left-0 w-full z-10 px-10 py-5 flex items-center justify-between text-white">
          <img
            src={logo}
            alt="logo"
            className="w-[150px] h-auto object-contain"
          />

          {/* Nav Links */}
          <nav>
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
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5 text-[24px] relative">
            {user ? (
              <div ref={dropdownRef} className="relative">
                <div
                  className="text-white w-10 h-10 flex items-center justify-center rounded-full cursor-pointer text-lg font-semibold hover:bg-green-700 transition-colors"
                  onClick={handleUserClick}
                >
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                {/* ✅ Fixed: Only show dropdown when showDropdown is true */}
                {showDropdown && (
                  <div className="absolute top-12 right-0 bg-white shadow-lg rounded-md z-50 w-48 py-2 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-gray-700 text-sm font-medium">{user.name || user.email}</p>
                      <p className="text-xs text-gray-500">ID: {user._id?.slice(-6)}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span onClick={handleUserClick} className="cursor-pointer hover:text-green-600 transition-colors">
                <FaRegUser className="text-black" />
              </span>
            )}

            {/* Cart icon */}
            <span className="relative cursor-pointer" onClick={handleCartClick}>
              <HiOutlineShoppingBag className="text-black hover:text-green-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="h-full justify-start items-center pt-10 w-[25%] flex flex-col gap-6">
        {/* Search */}
        <div className="relative w-full max-w-full mx-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Search the product..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-white border mt-1 rounded shadow max-h-80 overflow-y-auto">
              {suggestions.map((item) => (
                <li
                  key={item._id}
                  onClick={() => handleSelectSuggestion(item._id)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {item.images?.others?.[0] && (
                      <img
                        src={`${API_BASE}${item.images.others[0]}`}
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>  

        {/* Right stacked banners (dynamic from admin) */}
        <div className="flex-1 flex flex-col justify-between bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-4 flex-1 flex-col">
            {sideImages.slice(0, 3).map((banner, i) => (
              <div
                key={banner._id}
                className="w-full md:w-[48%] lg:w-[30%] relative rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  const productId =
                    typeof banner.productId === "object"
                      ? banner.productId._id
                      : banner.productId;

                  if (productId) {
                    navigate(`/product/${productId}`);
                  } else {
                    navigate("/shop/allproduct");
                  }
                }}
              >
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={`${API_BASE}${banner.imageUrl || banner.productImageUrl}?v=${banner._id}`}
                    alt={banner.title || `Best Seller ${i + 1}`}
                    className="w-full h-[110px] object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Product Details */}
                {banner.title && (
                  <div className="p-3 bg-white">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{banner.title}</h3>

                    {/* Price Section */}
                    {banner.price > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-600 font-bold text-lg">
                          ₹{Number.parseFloat(banner.price).toFixed(0)}
                        </span>
                        {banner.oldPrice > banner.price && (
                          <span className="text-gray-400 line-through text-xs">
                            ₹{Number.parseFloat(banner.oldPrice).toFixed(0)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Weight */}
                    {banner.weight?.value > 0 && (
                      <div className="text-gray-500 text-xs">
                        {banner.weight.value} {banner.weight.unit}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banners;
