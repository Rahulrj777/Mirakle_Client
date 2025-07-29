import { useEffect, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { removeFromCart, selectAddress, setAddresses, initializeSelectedAddress, setCartItem } from "../Redux/cartSlice"
import { axiosWithToken } from "../utils/axiosWithToken"
import { API_BASE } from "../utils/api"

const AddToCart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector((state) => {
    const items = state.cart?.items
    return Array.isArray(items) ? items : []
  })

  const [cartReady, setCartReady] = useState(false)
  const [stockSyncLoading, setStockSyncLoading] = useState(false)

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))
    } catch {
      return null
    }
  }, [])

  const userId = user?.user?.userId || user?.user?._id
  const token = user?.token

  // Enhanced stock checking function
  const isItemOutOfStock = (item) => {
    if (!item) return true
    const outOfStockConditions = [
      item.isOutOfStock === true,
      item.stock === 0,
      item.stock === "0",
      typeof item.stock === "number" && item.stock <= 0,
      item.stockMessage && item.stockMessage.toLowerCase().includes("out of stock"),
      item.isOutOfStock !== false && (item.stock === undefined || item.stock === null),
    ]
    return outOfStockConditions.some(Boolean)
  }

  // Separate available and out-of-stock items
  const availableItems = useMemo(() => {
    return cartItems.filter((item) => !isItemOutOfStock(item))
  }, [cartItems])

  const outOfStockItems = useMemo(() => {
    return cartItems.filter((item) => isItemOutOfStock(item))
  }, [cartItems])

  const hasOutOfStockItem = outOfStockItems.length > 0

  const subtotal = useMemo(() => {
    return availableItems.reduce((acc, item) => acc + (item.currentPrice || 0) * (item.quantity || 0), 0)
  }, [availableItems])

  const originalTotal = useMemo(() => {
    return availableItems.reduce((acc, item) => acc + (item.originalPrice || 0) * (item.quantity || 0), 0)
  }, [availableItems])

  // Fix cart persistence - sync with backend on load
  useEffect(() => {
    const syncCartFromBackend = async () => {
      if (!token || !userId) {
        setCartReady(true)
        return
      }

      try {
        const response = await axiosWithToken(token).get(`${API_BASE}/api/cart`)
        const backendCart = response.data

        if (backendCart && Array.isArray(backendCart.items)) {
          dispatch(setCartItem(backendCart.items))
          // Update localStorage
          localStorage.setItem(`cart_${userId}`, JSON.stringify(backendCart.items))
        } else if (Array.isArray(backendCart)) {
          dispatch(setCartItem(backendCart))
          localStorage.setItem(`cart_${userId}`, JSON.stringify(backendCart))
        }
      } catch (error) {
        console.error("Failed to sync cart from backend:", error)
        // Load from localStorage as fallback
        const localCart = localStorage.getItem(`cart_${userId}`)
        if (localCart) {
          try {
            const parsedCart = JSON.parse(localCart)
            if (Array.isArray(parsedCart)) {
              dispatch(setCartItem(parsedCart))
            }
          } catch (parseError) {
            console.error("Failed to parse local cart:", parseError)
            dispatch(setCartItem([]))
          }
        }
      } finally {
        setCartReady(true)
      }
    }

    syncCartFromBackend()
  }, [token, userId, dispatch])

  useEffect(() => {
    const getUserData = async () => {
      if (!user || !userId || !token) return
      try {
        const response = await axiosWithToken(token).get(`${API_BASE}/api/users/address`)
        const userData = response.data
        if (userData && userData.addresses) {
          dispatch(setAddresses(userData.addresses))
          const storedSelectedAddress = localStorage.getItem(`deliveryAddress_${userId}`)
          if (storedSelectedAddress) {
            try {
              const parsedAddress = JSON.parse(storedSelectedAddress)
              dispatch(selectAddress(parsedAddress))
            } catch (error) {
              console.error("Error parsing stored address:", error)
              dispatch(initializeSelectedAddress())
            }
          } else {
            dispatch(initializeSelectedAddress())
          }
        } else {
          dispatch(initializeSelectedAddress())
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    if (user && userId && token && cartReady) {
      getUserData()
    }
  }, [user, userId, token, dispatch, cartReady])

  // Stock sync using existing product API
  const syncCartWithStock = async () => {
    if (!cartReady || !token || !userId || cartItems.length === 0) return
    try {
      setStockSyncLoading(true)
      const response = await axiosWithToken(token).get(`${API_BASE}/api/products/all-products`)
      const allProducts = response.data

      const updatedCartItems = cartItems.map((cartItem) => {
        const currentProduct = allProducts.find((p) => p._id === cartItem._id)
        if (!currentProduct) {
          return {
            ...cartItem,
            isOutOfStock: true,
            stock: 0,
            stockMessage: "Product no longer available",
          }
        }

        const currentVariant = currentProduct.variants?.find((v) => v.size === cartItem.size)
        if (!currentVariant) {
          return {
            ...cartItem,
            isOutOfStock: true,
            stock: 0,
            stockMessage: "Variant no longer available",
          }
        }

        const isOutOfStock =
          currentProduct.isOutOfStock === true ||
          currentVariant.isOutOfStock === true ||
          currentVariant.stock === 0 ||
          currentVariant.stock === "0" ||
          (typeof currentVariant.stock === "number" && currentVariant.stock <= 0)

        return {
          ...cartItem,
          isOutOfStock,
          stock: currentVariant.stock,
          stockMessage: isOutOfStock ? "Currently out of stock" : null,
          originalPrice: currentVariant.price,
          discountPercent: currentVariant.discountPercent || 0,
          currentPrice: currentVariant.price - (currentVariant.price * (currentVariant.discountPercent || 0)) / 100,
        }
      })

      dispatch(setCartItem(updatedCartItems))
      // Update localStorage
      localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCartItems))
    } catch (error) {
      console.error("Failed to sync cart with stock:", error)
    } finally {
      setStockSyncLoading(false)
    }
  }

  useEffect(() => {
    if (cartReady && token && userId && cartItems.length > 0) {
      syncCartWithStock()
    }
  }, [cartReady, token, userId, cartItems.length])

  const handleManualStockSync = () => {
    syncCartWithStock()
  }

  const handleRemoveItem = async (item) => {
    try {
      dispatch(removeFromCart({ _id: item._id, variantId: item.variantId }))

      // Update localStorage
      const updatedCart = cartItems.filter(
        (cartItem) => !(cartItem._id === item._id && cartItem.variantId === item.variantId)
      )
      localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCart))

      // Sync with backend using correct endpoint and parameter names
      if (token) {
        try {
          await axiosWithToken(token).delete(`${API_BASE}/api/cart/item`, {
            data: { _id: item._id, variantId: item.variantId }
          })
        } catch (syncError) {
          console.warn("Failed to sync removal with backend:", syncError)
        }
      }
    } catch (error) {
      console.error("Failed to remove item:", error)
    }
  }

  if (!cartReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cart...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">Review your items and proceed to checkout</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {/* <p className="text-2xl font-bold text-gray-900">{cartItems?.length || 0}</p> */}
                {/* <p className="text-sm text-gray-500">Items</p> */}
              </div>
              <button
                onClick={handleManualStockSync}
                disabled={stockSyncLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all text-sm"
                title="Refresh stock status"
              >
                {/* {stockSyncLoading ? "🔄 Syncing..." : "🔄 Refresh Stock"} */}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Stock Status Alert */}
            {hasOutOfStockItem && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-red-800 font-medium">Some items are out of stock</h3>
                    <p className="text-red-600 text-sm mt-1">
                      {outOfStockItems.length} item{outOfStockItems.length > 1 ? "s" : ""} in your cart{" "}
                      {outOfStockItems.length > 1 ? "are" : "is"} currently unavailable. Remove them to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🛒</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
                <button
                  onClick={() => navigate("/shop/allproduct")}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Available Items */}
                {availableItems.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                        <span>✅</span>
                        Available Items ({availableItems.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {availableItems.map((item) => (
                        <div key={`${item._id}_${item.variantId}`} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <img
                                className="w-20 h-20 object-cover rounded-lg border"
                                src={item.images?.others?.[0]?.url || "/placeholder.svg?height=80&width=80"}
                                alt={item.title || "Product"}
                                loading="lazy"
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {item.title || "Unknown Product"}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">Size: {item.size || "N/A"}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">Qty: {item.quantity || 1}</span>
                              </div>
                              {typeof item.stock === "number" && item.stock <= 10 && item.stock > 0 && (
                                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  ⚡ Only {item.stock} left in stock
                                </div>
                              )}
                            </div>

                            {/* Stock Status */}
                            <div className="text-center">
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                {typeof item.stock === "number" ? `${item.stock} Available` : "In Stock"}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                ₹{((item.currentPrice || 0) * (item.quantity || 0)).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">₹{(item.currentPrice || 0).toFixed(2)} each</div>
                            </div>

                            {/* Remove Button */}
                            <button
                              className="text-red-500 hover:text-red-700 p-2 transition-colors"
                              onClick={() => handleRemoveItem(item)}
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Out of Stock Items */}
                {outOfStockItems.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-red-50 border-b border-red-200 px-6 py-3">
                      <h3 className="font-semibold text-red-800 flex items-center gap-2">
                        <span>⚠️</span>
                        Out of Stock Items ({outOfStockItems.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {outOfStockItems.map((item) => (
                        <div key={`${item._id}_${item.variantId}_oos`} className="p-6 bg-red-50">
                          <div className="flex items-center gap-4">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <img
                                className="w-20 h-20 object-cover rounded-lg border grayscale opacity-60"
                                src={item.images?.others?.[0]?.url || "/placeholder.svg?height=80&width=80"}
                                alt={item.title || "Product"}
                                loading="lazy"
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-700 truncate">
                                {item.title || "Unknown Product"}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">Size: {item.size || "N/A"}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">Qty: {item.quantity || 1}</span>
                              </div>
                              <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                📦 {item.stockMessage || "Currently out of stock"}
                              </div>
                            </div>

                            {/* Out of Stock Badge */}
                            <div className="text-center">
                              <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg font-medium text-sm">
                                OUT OF STOCK
                              </div>
                            </div>

                            {/* Price (crossed out) */}
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-500 line-through">
                                ₹{((item.currentPrice || 0) * (item.quantity || 0)).toFixed(2)}
                              </div>
                              <div className="text-sm text-red-600">Unavailable</div>
                            </div>

                            {/* Remove Button */}
                            <button
                              className="text-red-500 hover:text-red-700 p-2 transition-colors"
                              onClick={() => handleRemoveItem(item)}
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Continue Shopping */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <button
                    onClick={() => navigate("/shop/allproduct")}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4">
                {/* Price Breakdown */}
                <div className="flex justify-between text-gray-600">
                  <span>
                    Price ({availableItems.length} available item{availableItems.length !== 1 ? "s" : ""})
                  </span>
                  <span>₹{originalTotal.toFixed(2)}</span>
                </div>

                {outOfStockItems.length > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Out of Stock ({outOfStockItems.length})</span>
                    <span>Excluded</span>
                  </div>
                )}

                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{(originalTotal - subtotal).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="text-green-600">Free</span>
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {originalTotal - subtotal > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">
                      🎉 You saved ₹{(originalTotal - subtotal).toFixed(2)} on this order!
                    </p>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <div className="mt-6">
                {hasOutOfStockItem && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="text-red-800 text-sm font-medium mb-1">⚠️ Cannot proceed with checkout</div>
                    <div className="text-red-600 text-sm">
                      Remove {outOfStockItems.length} out of stock item{outOfStockItems.length > 1 ? "s" : ""} to
                      continue
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate("/checkout")}
                  disabled={availableItems.length === 0 || hasOutOfStockItem}
                  className={`w-full py-4 text-lg font-semibold rounded-lg transition-all ${
                    hasOutOfStockItem || availableItems.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {hasOutOfStockItem
                    ? "Remove Out of Stock Items"
                    : availableItems.length === 0
                      ? "Cart is Empty"
                      : `Proceed to Checkout (${availableItems.length} items)`}
                </button>
              </div>

              {/* Security Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Why shop with us?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>7-day easy returns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Free shipping on orders above ₹499</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>24/7 customer support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddToCart
