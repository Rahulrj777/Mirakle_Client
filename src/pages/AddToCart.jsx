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
import { useMemo } from "react"

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

  const cartItems = useSelector((state) => state.cart.items)
  const cartReady = useSelector((state) => state.cart.cartReady)
  const userId = useSelector((state) => state.cart.userId)
  const addresses = useSelector((state) => state.cart.addresses)
  const selectedAddress = useSelector((state) => state.cart.selectedAddress)

  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressesLoaded, setAddressesLoaded] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(false)

  // Get user and token from localStorage with error handling
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

  const safeCartItems = useMemo(() => {
    return Array.isArray(cartItems) ? cartItems : []
  }, [cartItems])

  const subtotal = useMemo(() => {
    return safeCartItems.reduce(
      (acc, item) => acc + (item.currentPrice || 0) * (item.quantity || 0),
      0
    )
  }, [safeCartItems])

  const originalTotal = useMemo(() => {
    return safeCartItems.reduce(
      (acc, item) => acc + (item.originalPrice || 0) * (item.quantity || 0),
      0
    )
  }, [safeCartItems])

  const discountAmount = useMemo(() => originalTotal - subtotal, [originalTotal, subtotal])

  // Fetch saved addresses on first load
  useEffect(() => {
    if (!cartReady || !token || !userId || addressesLoaded) return

    setAddressesLoading(true)
    axiosWithToken(token)
      .get(`${API_BASE}/api/users/address`)
      .then((res) => {
        if (Array.isArray(res.data.addresses)) {
          dispatch(setAddresses(res.data.addresses))
          setAddressesLoaded(true)

          // Initialize selected address if saved in localStorage and still valid
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

  // Debounced cart sync to backend
  useEffect(() => {
    if (!cartReady || !token || !user || !userId) return

    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Compare previous cart to avoid redundant sync
    if (JSON.stringify(prevCartRef.current) === JSON.stringify(safeCartItems)) return

    // Debounce the sync operation
    syncTimeoutRef.current = setTimeout(() => {
      prevCartRef.current = [...safeCartItems]

      // Update localStorage cache for this specific user
      localStorage.setItem(`cart_${userId}`, JSON.stringify(safeCartItems))

      // Sync to backend
      axiosWithToken(token)
        .post("/cart", { items: safeCartItems })
        .then(() => {
          console.log("✅ Cart synced successfully")
        })
        .catch((err) => {
          console.error("❌ Cart sync failed:", err)
          // Optionally show user notification here
        })
    }, 500) // 500ms debounce

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [safeCartItems, cartReady, token, user, userId])

  // Address modal outside click to close
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

  if (!cartReady) {
    return <LoadingPlaceholder />
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Cart items and address */}
        <div className="lg:col-span-2 space-y-4">
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
            safeCartItems.map((item) => (
              <div key={`${item._id}_${item.variantId}`} className="bg-white rounded shadow p-4 flex gap-4">
                <img
                  src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                  alt={item.title || "Product"}
                  loading="lazy"
                  className="w-28 h-28 object-cover border rounded"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.title || "Unknown Product"}</h2>
                  <p className="text-sm text-gray-600">Size: {item.size || "N/A"}</p>
                  <p className="text-sm text-gray-500 mb-2">Seller: Mirakle</p>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold text-xl">₹{(item.currentPrice || 0).toFixed(2)}</span>
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
                    <div className="flex items-center border rounded">
                      <button
                        className="px-3 py-1 text-lg hover:bg-gray-100"
                        onClick={() => dispatch(decrementQuantity({ _id: item._id, variantId: item.variantId }))}
                      >
                        −
                      </button>
                      <span className="px-4">{item.quantity || 0}</span>
                      <button
                        className="px-3 py-1 text-lg hover:bg-gray-100"
                        onClick={() => dispatch(incrementQuantity({ _id: item._id, variantId: item.variantId }))}
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
            ))
          )}
        </div>

        {/* Right side - Price details */}
        <div className="bg-white p-6 rounded shadow sticky top-28">
          <h3 className="text-xl font-bold mb-4">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span>
              Price ({safeCartItems.length} item{safeCartItems.length > 1 ? "s" : ""})
            </span>
            <span>₹{originalTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount</span>
            <span className="text-green-600">− ₹{discountAmount.toFixed(2)}</span>
          </div>
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
            disabled={safeCartItems.length === 0}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded font-semibold"
          >
            PLACE ORDER
          </button>
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
