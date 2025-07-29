"use client"

import logo from "../assets/logo.png"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { FaRegUser } from "react-icons/fa"
import { useDispatch, useSelector } from "react-redux"
import { useState, useEffect, useCallback, useRef } from "react"
import { clearUser } from "../Redux/cartSlice"
import axios from "axios"
import { API_BASE } from "../utils/api"
import { axiosWithToken } from "../utils/axiosWithToken"

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items) || []
  const cartCount = cartItems.length

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))?.user || null
    } catch {
      return null
    }
  })

  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  const searchBoxRef = useRef(null)
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)

  // Check if route is active
  const isActive = useCallback((path) => location.pathname === path, [location.pathname])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.token) return

    try {
      const response = await axiosWithToken(user.token).get(`${API_BASE}/api/notifications`)
      const userNotifications = response.data || []
      setNotifications(userNotifications)
      setNotificationCount(userNotifications.filter((n) => !n.read).length)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setNotifications([])
      setNotificationCount(0)
    }
  }, [user?.token])

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!user?.token) return

      try {
        await axiosWithToken(user.token).patch(`${API_BASE}/api/notifications/${notificationId}/read`)
        setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))
        setNotificationCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    },
    [user?.token],
  )

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification) => {
      markAsRead(notification._id)
      setShowNotifications(false)

      // Navigate based on notification type
      if (notification.type === "stock_available" && notification.productId) {
        navigate(`/product/${notification.productId}`)
      }
    },
    [markAsRead, navigate],
  )

  // Handle search suggestions click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSuggestions([])
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch notifications on user change
  useEffect(() => {
    if (user?.token) {
      fetchNotifications()
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user?.token, fetchNotifications])

  // Handle search input
  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    try {
      const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`)
      setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 6) : [])
    } catch (error) {
      console.error("Search error:", error)
      setSuggestions([])
    }
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
    setSuggestions([])
    setSearchTerm("")
  }

  const handleUserClick = () => {
    if (user) {
      setShowDropdown((prev) => !prev)
    } else {
      navigate("/login_signup")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("mirakleUser")
    dispatch(clearUser())
    setUser(null)
    setShowDropdown(false)
    setNotifications([])
    setNotificationCount(0)
    navigate("/login_signup")
  }

  const handleCartClick = () => {
    if (!user) {
      alert("Please login to view your cart")
      navigate("/login_signup")
    } else {
      navigate("/AddToCart")
    }
  }

  const handleNotificationToggle = () => {
    setShowNotifications((prev) => !prev)
  }

  return (
    <header className="w-full px-10 py-5 flex items-center justify-between bg-transparent text-white h-[80px] top-0 left-0 z-50">
      {/* Logo */}
      <Link to="/">
        <img src={logo || "/placeholder.svg"} alt="logo" className="w-[150px] object-contain" />
      </Link>

      {/* Navigation Links */}
      <nav>
        <ul className="flex gap-6 font-semibold text-lg">
          {[
            { path: "/", label: "Home" },
            { path: "/shop/allproduct", label: "Shop" },
            { path: "/About_Us", label: "About Us" },
            { path: "/Contact_Us", label: "Contact Us" },
          ].map((item) => (
            <li key={item.path} className="cursor-pointer flex flex-col items-center">
              <Link
                to={item.path}
                className={`text-black transition-colors ${
                  isActive(item.path) ? "font-bold text-green-700" : "text-gray-700"
                }`}
              >
                {item.label}
              </Link>
              {isActive(item.path) && <div className="mt-1 w-3/4 h-[3px] bg-green-700 rounded-full" />}
            </li>
          ))}
        </ul>
      </nav>

      {/* Search & Icons */}
      <div className="flex items-center gap-5 text-[24px] relative">
        {/* Search Box */}
        <div className="relative" ref={searchBoxRef}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-[200px] px-3 py-1.5 text-sm text-black border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-50 bg-white text-black border mt-1 rounded shadow-md max-h-60 overflow-y-auto w-full text-sm">
              {suggestions.map((item) => (
                <li
                  key={item._id}
                  onClick={() => handleSelectSuggestion(item._id)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    {item.images?.others?.[0]?.url && (
                      <img
                        src={item.images.others[0].url || "/placeholder.svg"}
                        alt={item.title}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span className="flex-1 truncate">{item.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications */}
        {user && (
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationToggle}
              className="relative text-black hover:text-green-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 bg-white text-black shadow-lg rounded-md z-50 w-80 max-h-96 overflow-y-auto border">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {notificationCount > 0 && <p className="text-xs text-gray-600">{notificationCount} unread</p>}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-4xl mb-2">🔔</div>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {notification.type === "stock_available" ? "📦" : "🔔"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t bg-gray-50">
                    <button
                      onClick={() => {
                        // Mark all as read
                        notifications.forEach((n) => {
                          if (!n.read) markAsRead(n._id)
                        })
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Icon */}
        {user ? (
          <div ref={dropdownRef} className="relative">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-700 cursor-pointer"
              onClick={handleUserClick}
            >
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            {showDropdown && (
              <div className="absolute top-12 right-0 bg-white text-black shadow-lg rounded-md z-50 w-48 py-2 border">
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
            <FaRegUser />
          </span>
        )}

        {/* Cart Icon */}
        <span className="relative cursor-pointer" onClick={handleCartClick}>
          <HiOutlineShoppingBag className="text-black transition-colors" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </span>
      </div>
    </header>
  )
}

export default Header
