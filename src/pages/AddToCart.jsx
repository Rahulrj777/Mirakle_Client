"use client"

import { useEffect, useState, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  selectAddress,
  setAddresses,
  initializeSelectedAddress,
} from "../Redux/cartSlice"
import { useNavigate } from "react-router-dom"
import { axiosWithToken } from "../utils/axiosWithToken"
import { API_BASE } from "../utils/api"

const LoadingPlaceholder = () => (
  <div className="bg-gray-100 min-h-screen py-6">
    <div className="max-w-6xl mx-auto px-4">
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
)

const AddToCart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const modalRef = useRef()
  const prevCartRef = useRef([])
  const syncTimeoutRef = useRef(null)
  const stockCheckIntervalRef = useRef(null)

  // Redux state
  const cartItems = useSelector((state) => state.cart.items)
  const cartReady = useSelector((state) => state.cart.cartReady)
  const userId = useSelector((state) => state.cart.userId)
  const addresses = useSelector((state) => state.cart.addresses)
  const selectedAddress = useSelector((state) => state.cart.selectedAddress)

  // Local state
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressesLoaded, setAddressesLoaded] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [outOfStockItems, setOutOfStockItems] = useState(new Set())
  const [stockCheckLoading, setStockCheckLoading] = useState(false)

  // Get user and token from localStorage
  const getUserData = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("mirakleUser"))
      return {
        user: userData?.user || null,
        token: userData?.token || null,
      }
    } catch {
      return { user: null, token: null }
    }
  }

  const { user, token } = getUserData()
  const safeCartItems = Array.isArray(cartItems) ? cartItems : []

  // Stock checking function
  const checkStockStatus = async () => {
    if (!token || safeCartItems.length === 0) {
      console.log("🔍 Stock check skipped - no token or empty cart")
      return
    }

    setStockCheckLoading(true)
    console.log("🔍 Starting stock check for", safeCartItems.length, "items")

    try {
      const productIds = safeCartItems.map((item) => ({
        productId: item._id,
        variantId: item.variantId,
      }))

      console.log("🔍 Checking stock for items:", productIds)
      console.log("🔍 API URL:", `${API_BASE}/api/products/check-stock`)

      const response = await axiosWithToken(token).post(`${API_BASE}/api/products/check-stock`, {
        items: productIds,
      })

      console.log("✅ Stock check response:", response.data)

      const stockData = response.data.stockStatus || []
      const newOutOfStockItems = new Set()

      stockData.forEach((item) => {
        console.log(
          `📊 Item ${item.productId}_${item.variantId}: inStock=${item.inStock}, quantity=${item.availableQuantity}`,
        )

        if (!item.inStock || item.availableQuantity === 0) {
          newOutOfStockItems.add(`${item.productId}_${item.variantId}`)
        }
      })

      console.log("📋 Out of stock items:", Array.from(newOutOfStockItems))

      // Check for newly out of stock items
      const previouslyInStock = Array.from(outOfStockItems)
      const newlyOutOfStock = Array.from(newOutOfStockItems).filter((item) => !previouslyInStock.includes(item))

      if (newlyOutOfStock.length > 0) {
        const outOfStockProducts = safeCartItems.filter((item) =>
          newlyOutOfStock.includes(`${item._id}_${item.variantId}`),
        )
        const productNames = outOfStockProducts.map((item) => item.title).join(", ")
        console.log("🚨 Newly out of stock products:", productNames)

        // Show notification
        alert(`⚠️ The following items in your cart are now out of stock: ${productNames}`)
      }

      setOutOfStockItems(newOutOfStockItems)
    } catch (error) {
      console.error("❌ Stock check failed:", error)
      console.error("❌ Error response:", error.response?.data)
      console.error("❌ Error status:", error.response?.status)

      // Show user-friendly error
      if (error.response?.status === 404) {
        console.error("❌ Stock check API endpoint not found")
      } else if (error.response?.status === 401) {
        console.error("❌ Authentication failed for stock check")
      }
    } finally {
      setStockCheckLoading(false)
    }
  }

  // Initial stock check and interval setup
  useEffect(() => {
    if (!token || safeCartItems.length === 0) {
      console.log("❌ Stock check conditions not met:", {
        hasToken: !!token,
        hasItems: safeCartItems.length > 0,
      })
      return
    }

    console.log("🚀 Setting up stock check...")

    // Initial check
    checkStockStatus()

    // Set up interval for periodic checks (every 30 seconds)
    if (stockCheckIntervalRef.current) {
      clearInterval(stockCheckIntervalRef.current)
    }

    stockCheckIntervalRef.current = setInterval(() => {
      console.log("⏰ Periodic stock check triggered")
      checkStockStatus()
    }, 30000)

    return () => {
      if (stockCheckIntervalRef.current) {
        console.log("🧹 Cleaning up stock check interval")
        clearInterval(stockCheckIntervalRef.current)
      }
    }
  }, [token, safeCartItems.length])

  // Calculate totals (excluding out of stock items)
  const availableItems = safeCartItems.filter((item) => !outOfStockItems.has(`${item._id}_${item.variantId}`))
  const subtotal = availableItems.reduce((acc, item) => acc + (item.currentPrice || 0) * (item.quantity || 0), 0)
  const originalTotal = availableItems.reduce((acc, item) => acc + (item.originalPrice || 0) * (item.quantity || 0), 0)
  const discountAmount = originalTotal - subtotal

  // Address loading
  useEffect(() => {
    if (!cartReady || !token || !userId || addressesLoaded) return

    setAddressesLoading(true)
    axiosWithToken(token)
      .get(`${API_BASE}/api/users/address`)
      .then((res) => {
        if (Array.isArray(res.data.addresses)) {
          dispatch(setAddresses(res.data.addresses))
          setAddressesLoaded(true)

          // Initialize selected address from localStorage
          const savedAddressStr = localStorage.getItem(`deliveryAddress_${userId}`)
          if (savedAddressStr) {
            try {
              const savedAddress = JSON.parse(savedAddressStr)
              const exists = res.data.addresses.some((addr) => addr._id === savedAddress._id)
              if (exists) {
                dispatch(initializeSelectedAddress(savedAddress))
              } else {
                localStorage.removeItem(`deliveryAddress_${userId}`)
                dispatch(selectAddress(null))
              }
            } catch {
              localStorage.removeItem(`deliveryAddress_${userId}`)
              dispatch(selectAddress(null))
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load addresses:", err)
      })
      .finally(() => {
        setAddressesLoading(false)
      })
  }, [cartReady, token, userId, dispatch, addressesLoaded])

  // Cart sync to backend
  useEffect(() => {
    if (!cartReady || !token || !user || !userId) return

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    if (JSON.stringify(prevCartRef.current) === JSON.stringify(safeCartItems)) return

    syncTimeoutRef.current = setTimeout(() => {
      prevCartRef.current = [...safeCartItems]
      localStorage.setItem(`cart_${userId}`, JSON.stringify(safeCartItems))

      axiosWithToken(token)
        .post("/cart", { items: safeCartItems })
        .then(() => {
          console.log("✅ Cart synced successfully")
        })
        .catch((err) => {
          console.error("❌ Cart sync failed:", err)
        })
    }, 500)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [safeCartItems, cartReady, token, user, userId])

  // Modal click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddressModal(false)
      }
    }

    if (showAddressModal) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showAddressModal])

  // Address handlers
  const handleAddressSelect = (address) => {
    dispatch(selectAddress(address))
    localStorage.setItem(`deliveryAddress_${userId}`, JSON.stringify(address))
    setShowAddressModal(false)
  }

  const confirmDelete = (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      handleDeleteAddress(addressId)
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      const res = await axiosWithToken(token).delete(`${API_BASE}/api/users/address/${id}`)
      if (res.data.addresses) {
        dispatch(setAddresses(res.data.addresses))
        if (selectedAddress?._id === id) {
          localStorage.removeItem(`deliveryAddress_${userId}`)
          if (res.data.addresses.length > 0) {
            const newSelected = res.data.addresses[0]
            dispatch(selectAddress(newSelected))
            localStorage.setItem(`deliveryAddress_${userId}`, JSON.stringify(newSelected))
          } else {
            dispatch(selectAddress(null))
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete address:", error)
      alert("Could not delete address. Please try again later.")
    }
  }

  // Quantity change handler
  const handleQuantityChange = (item, action) => {
    const itemKey = `${item._id}_${item.variantId}`
    if (outOfStockItems.has(itemKey)) {
      alert("This item is currently out of stock and cannot be modified.")
      return
    }

    if (action === "increment") {
      dispatch(incrementQuantity({ _id: item._id, variantId: item.variantId }))
    } else {
      dispatch(decrementQuantity({ _id: item._id, variantId: item.variantId }))
    }
  }

  // Manual stock check for testing
  const testStockCheck = () => {
    console.log("🧪 Manual stock check triggered")
    checkStockStatus()
  }

  if (!cartReady) {
    return <LoadingPlaceholder />
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Cart items and address */}
        <div className="lg:col-span-2 space-y-4">
          {/* Debug Section - Remove in production */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>API_BASE: {API_BASE}</p>
              <p>Token exists: {token ? "✅ Yes" : "❌ No"}</p>
              <p>Cart items: {safeCartItems.length}</p>
              <p>Out of stock items: {outOfStockItems.size}</p>
              <p>Cart ready: {cartReady ? "✅ Yes" : "❌ No"}</p>
              <p>Stock check loading: {stockCheckLoading ? "🔄 Yes" : "✅ No"}</p>
            </div>
            <div className="mt-2 space-x-2">
              <button
                onClick={testStockCheck}
                disabled={stockCheckLoading}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {stockCheckLoading ? "Checking..." : "Test Stock Check"}
              </button>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white p-4 rounded shadow flex justify-between items-center">
            {addressesLoading ? (
              <div className="flex items-center animate-pulse space-x-4">
                <div className="rounded-full bg-gray-300 h-4 w-4"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                  <div className="h-3 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            ) : selectedAddress ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Deliver to: {selectedAddress.name}, {selectedAddress.pincode}
                  </p>
                  <p className="text-md">
                    {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.landmark}
                  </p>
                </div>
                <button onClick={() => setShowAddressModal(true)} className="text-blue-600 hover:underline text-sm">
                  Change
                </button>
              </>
            ) : (
              <button onClick={() => setShowAddressModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
                Select Address
              </button>
            )}
          </div>

          {/* Out of Stock Notification */}
          {outOfStockItems.size > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-center">
                <div className="text-red-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="ml-2 text-red-800 text-sm">
                  ⚠️ Some items in your cart are currently out of stock and cannot be ordered.
                </p>
              </div>
            </div>
          )}

          {/* Stock Check Loading */}
          {stockCheckLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="ml-2 text-blue-800 text-sm">🔄 Checking stock availability...</p>
              </div>
            </div>
          )}

          {/* Cart Items */}
          {safeCartItems.length === 0 ? (
            <div className="bg-white rounded shadow p-8 text-center">
              <p className="text-gray-600 text-lg">Your cart is empty.</p>
              <button
                onClick={() => navigate("/shop/allproduct")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            safeCartItems.map((item) => {
              const itemKey = `${item._id}_${item.variantId}`
              const isOutOfStock = outOfStockItems.has(itemKey)

              return (
                <div
                  key={itemKey}
                  className={`bg-white rounded shadow p-4 flex gap-4 transition-all ${
                    isOutOfStock ? "opacity-60 border-2 border-red-200 bg-red-50" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={item.images?.others?.[0]?.url || "/placeholder.svg?height=112&width=112"}
                      alt={item.title || "Product"}
                      loading="lazy"
                      className="w-28 h-28 object-cover border rounded"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center rounded">
                        <span className="bg-red-500 text-white px-2 py-1 text-xs rounded font-semibold">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-lg font-semibold ${isOutOfStock ? "text-gray-500" : ""}`}>
                      {item.title || "Unknown Product"}
                    </h2>
                    <p className="text-sm text-gray-600">Size: {item.size || "N/A"}</p>
                    <p className="text-sm text-gray-500 mb-2">Seller: Mirakle</p>
                    <p className="text-xs text-gray-400">
                      ID: {item._id} | Variant: {item.variantId}
                    </p>

                    {isOutOfStock && (
                      <p className="text-red-600 text-sm font-medium mb-2">⚠️ This item is currently out of stock</p>
                    )}

                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-xl ${isOutOfStock ? "text-gray-500" : "text-green-600"}`}>
                        ₹{(item.currentPrice || 0).toFixed(2)}
                      </span>
                      {(item.originalPrice || 0) > (item.currentPrice || 0) && (
                        <>
                          <span className="line-through text-sm text-gray-500">
                            ₹{(item.originalPrice || 0).toFixed(2)}
                          </span>
                          <span className="text-red-500 text-sm font-medium">
                            {Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100)}% Off
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className={`flex items-center border rounded ${isOutOfStock ? "opacity-50" : ""}`}>
                        <button
                          className="px-3 py-1 text-lg hover:bg-gray-100 disabled:cursor-not-allowed"
                          onClick={() => handleQuantityChange(item, "decrement")}
                          disabled={isOutOfStock}
                        >
                          −
                        </button>
                        <span className="px-4">{item.quantity || 0}</span>
                        <button
                          className="px-3 py-1 text-lg hover:bg-gray-100 disabled:cursor-not-allowed"
                          onClick={() => handleQuantityChange(item, "increment")}
                          disabled={isOutOfStock}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-red-500 text-sm hover:underline"
                        onClick={() => dispatch(removeFromCart({ _id: item._id, variantId: item.variantId }))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right side - Price details */}
        <div className="bg-white p-6 rounded shadow sticky top-28">
          <h3 className="text-xl font-bold mb-4">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span>
              Price ({availableItems.length} available item{availableItems.length > 1 ? "s" : ""})
            </span>
            <span>₹{originalTotal.toFixed(2)}</span>
          </div>
          {outOfStockItems.size > 0 && (
            <div className="flex justify-between mb-2 text-red-600 text-sm">
              <span>
                ({outOfStockItems.size} out of stock item{outOfStockItems.size > 1 ? "s" : ""} excluded)
              </span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between mb-2">
              <span>Discount</span>
              <span className="text-green-600">− ₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between mb-2">
            <span>Delivery Charges</span>
            <span className="text-green-600">Free</span>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => navigate("/checkout")}
            disabled={availableItems.length === 0}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded font-semibold transition-colors"
          >
            PLACE ORDER ({availableItems.length} items)
          </button>
          {outOfStockItems.size > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Out of stock items will not be included in your order
            </p>
          )}
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-y-auto z-50">
          <div ref={modalRef} className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Select Delivery Address</h2>
            {addresses.length === 0 ? (
              <p className="text-gray-500">No addresses saved yet.</p>
            ) : (
              addresses.map((addr, idx) => (
                <div key={addr._id || idx} className="border p-3 rounded mb-2 relative">
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddress?._id === addr._id}
                    onChange={() => handleAddressSelect(addr)}
                  />
                  <span className="ml-2 font-medium">
                    {addr.name}, {addr.pincode}
                  </span>
                  <p className="text-sm text-gray-600">
                    {addr.line1}, {addr.city}, {addr.landmark}
                  </p>
                  <button
                    onClick={() => confirmDelete(addr._id)}
                    className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
            <button
              onClick={() => {
                setShowAddressModal(false)
                navigate("/address")
              }}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
            >
              Add New Address
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddToCart
