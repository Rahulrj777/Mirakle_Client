"use client"

import { Link, useLocation, useNavigate } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { useSelector, useDispatch } from "react-redux"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import axios from "axios"
import logo from "../assets/logo.png"
import { API_BASE } from "../utils/api"
import { setCartItem, setUserId, clearUser } from "../Redux/cartSlice"

const Header = () => {
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

  const isActive = useCallback((path) => location.pathname === path, [location.pathname])

  // ✅ Memoize cart count to prevent unnecessary re-renders
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

  return (
    <header className="sticky top-0 z-[150] shadow-md bg-white">
      <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src={logo || "/placeholder.svg"} alt="logo" className="w-25 h-10 object-contain" />
        </Link>

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

        {/* Icons */}
        <div className="flex items-center gap-5 text-[24px] relative">
          {user ? (
            <div ref={dropdownRef} className="relative">
              <div
                className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full cursor-pointer text-lg font-semibold hover:bg-green-700 transition-colors"
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

      {/* Nav Links */}
      <nav className="bg-[rgb(119,221,119)]">
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
    </header>
  )
}

export default Header
