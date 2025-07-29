"use client"

import { useEffect, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  selectAddress,
  setAddresses,
  initializeSelectedAddress,
  updateCartItemsStock,
} from "../Redux/cartSlice"
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

  // Simple and direct stock checking function
  const isItemOutOfStock = (item) => {
    if (!item) return true

    // Check all possible out-of-stock conditions
    const outOfStockConditions = [
      item.isOutOfStock === true,
      item.stock === 0,
      item.stock === "0",
      typeof item.stock === "number" && item.stock <= 0,
      item.stockMessage && item.stockMessage.toLowerCase().includes("out of stock"),
    ]

    const isOOS = outOfStockConditions.some(Boolean)

    console.log(`Stock check for ${item.title}:`, {
      isOutOfStock: item.isOutOfStock,
      stock: item.stock,
      stockMessage: item.stockMessage,
      result: isOOS ? "OUT OF STOCK" : "IN STOCK",
    })

    return isOOS
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

  // Simplified getUserData function
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
        setCartReady(true)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setCartReady(false)
      }
    }

    if (user && userId && token) {
      getUserData()
    }
  }, [user, userId, token, dispatch])

  // Simplified stock sync function
  const syncCartWithStock = async () => {
    if (!cartReady || !token || !userId || cartItems.length === 0) return

    try {
      setStockSyncLoading(true)
      console.log("🔄 Syncing cart with current stock status...")

      const productIds = [...new Set(cartItems.map((item) => item._id))]
      console.log("Checking stock for products:", productIds)

      const response = await axiosWithToken(token).post(`${API_BASE}/api/products/check-stock`, {
        productIds,
      })

      const currentProducts = response.data.products
      console.log("Stock data received:", currentProducts)

      const stockUpdates = []

      cartItems.forEach((cartItem) => {
        const currentProduct = currentProducts.find((p) => p._id === cartItem._id)

        if (!currentProduct) {
          stockUpdates.push({
            _id: cartItem._id,
            variantId: cartItem.variantId,
            isOutOfStock: true,
            stock: 0,
            stockMessage: "Product no longer available",
          })
          return
        }

        // Find matching variant
        const currentVariant = currentProduct.variants.find((v) => {
          return v.size === cartItem.size
        })

        if (!currentVariant) {
          stockUpdates.push({
            _id: cartItem._id,
            variantId: cartItem.variantId,
            isOutOfStock: true,
            stock: 0,
            stockMessage: "Variant no longer available",
          })
          return
        }

        // Check if out of stock
        const isOutOfStock =
          currentProduct.isOutOfStock === true ||
          currentVariant.isOutOfStock === true ||
          currentVariant.stock === 0 ||
          currentVariant.stock === "0" ||
          (typeof currentVariant.stock === "number" && currentVariant.stock <= 0)

        console.log(`Stock update for ${cartItem.title}:`, {
          productOOS: currentProduct.isOutOfStock,
          variantOOS: currentVariant.isOutOfStock,
          variantStock: currentVariant.stock,
          finalOOS: isOutOfStock,
        })

        stockUpdates.push({
          _id: cartItem._id,
          variantId: cartItem.variantId,
          isOutOfStock,
          stock: currentVariant.stock,
          stockMessage: isOutOfStock ? "Currently out of stock" : null,
          originalPrice: currentVariant.price,
          discountPercent: currentVariant.discountPercent || 0,
          currentPrice: currentVariant.price - (currentVariant.price * (currentVariant.discountPercent || 0)) / 100,
        })
      })

      console.log("Applying stock updates:", stockUpdates)
      dispatch(updateCartItemsStock(stockUpdates))

      const outOfStockCount = stockUpdates.filter((update) => update.isOutOfStock).length
      if (outOfStockCount > 0) {
        console.log(`⚠️ ${outOfStockCount} items in cart are now out of stock`)
      }
    } catch (error) {
      console.error("❌ Failed to sync cart with stock:", error)
    } finally {
      setStockSyncLoading(false)
    }
  }

  // Sync stock when cart is ready
  useEffect(() => {
    if (cartReady && token && userId && cartItems.length > 0) {
      console.log("🚀 Initial stock sync...")
      syncCartWithStock()
    }
  }, [cartReady, token, userId, cartItems.length])

  // Manual stock refresh
  const handleManualStockSync = () => {
    console.log("🔄 Manual stock sync triggered")
    syncCartWithStock()
  }

  if (!cartReady) {
    return (
      <div className="container mx-auto mt-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto mt-10">
      <div className="flex shadow-md my-10">
        <div className="w-3/4 bg-white px-10 py-10">
          <div className="flex justify-between border-b pb-8">
            <h1 className="font-semibold text-2xl">Shopping Cart</h1>
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-2xl">{cartItems?.length} Items</h2>
              <button
                onClick={handleManualStockSync}
                disabled={stockSyncLoading}
                className="text-blue-600 hover:underline text-sm disabled:opacity-50"
                title="Refresh stock status"
              >
                {stockSyncLoading ? "🔄 Syncing..." : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {/* Stock Status Alert */}
          {hasOutOfStockItem && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
              <h3 className="text-red-800 font-medium mb-2">⚠️ Some items are out of stock</h3>
              <p className="text-red-600 text-sm">
                {outOfStockItems.length} item{outOfStockItems.length > 1 ? "s" : ""} in your cart{" "}
                {outOfStockItems.length > 1 ? "are" : "is"} currently unavailable. Remove them to continue with your
                order.
              </p>
            </div>
          )}

          <div className="flex mt-10 mb-5">
            <h3 className="font-semibold text-gray-600 text-xs uppercase w-2/5">Product Details</h3>
            <h3 className="font-semibold text-gray-600 text-xs uppercase w-1/5 text-center">Quantity</h3>
            <h3 className="font-semibold text-gray-600 text-xs uppercase w-1/5 text-center">Price</h3>
            <h3 className="font-semibold text-gray-600 text-xs uppercase w-1/5 text-center">Total</h3>
          </div>

          {cartItems.length === 0 ? (
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
            <>
              {/* Available Items */}
              {availableItems.map((item) => (
                <div
                  key={`${item._id}_${item.variantId}`}
                  className="flex items-center hover:bg-gray-100 -mx-8 px-6 py-5"
                >
                  <div className="flex w-2/5">
                    <div className="w-20">
                      <img
                        className="h-24"
                        src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                        alt={item.title || "Product"}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col justify-between ml-4 flex-grow">
                      <span className="font-bold text-sm">{item.title || "Unknown Product"}</span>
                      <span className="text-red-500 text-xs">Size: {item.size || "N/A"}</span>
                      <span className="text-gray-500 text-xs">Seller: Mirakle</span>

                      {/* Stock warning for low stock */}
                      {typeof item.stock === "number" && item.stock <= 10 && item.stock > 0 && (
                        <span className="text-orange-600 text-xs">⚡ Only {item.stock} left in stock</span>
                      )}

                      <button
                        className="font-semibold hover:text-red-500 text-gray-500 text-xs"
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              _id: item._id,
                              variantId: item.variantId,
                            }),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center w-1/5">
                    <svg
                      className="fill-current text-gray-600 w-3 cursor-pointer"
                      viewBox="0 0 448 512"
                      onClick={() =>
                        dispatch(
                          decrementQuantity({
                            _id: item._id,
                            variantId: item.variantId,
                          }),
                        )
                      }
                    >
                      <path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
                    </svg>
                    <input className="mx-2 border text-center w-8" type="text" value={item.quantity || 0} readOnly />
                    <svg
                      className={`fill-current w-3 cursor-pointer ${
                        typeof item.stock === "number" && item.quantity >= item.stock
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600"
                      }`}
                      viewBox="0 0 448 512"
                      onClick={() => {
                        if (typeof item.stock === "number" && item.quantity >= item.stock) return
                        dispatch(
                          incrementQuantity({
                            _id: item._id,
                            variantId: item.variantId,
                          }),
                        )
                      }}
                    >
                      <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
                    </svg>
                  </div>
                  <span className="text-center w-1/5 font-semibold text-sm">
                    ₹{(item.currentPrice || 0).toFixed(2)}
                  </span>
                  <span className="text-center w-1/5 font-semibold text-sm">
                    ₹{((item.currentPrice || 0) * (item.quantity || 0)).toFixed(2)}
                  </span>
                </div>
              ))}

              {/* Out of Stock Items Section */}
              {outOfStockItems.length > 0 && (
                <div className="mt-8 space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h3 className="text-red-800 font-medium mb-2">⚠️ Out of Stock Items</h3>
                    <p className="text-red-600 text-sm">
                      The following items are currently unavailable. Remove them to continue with your order.
                    </p>
                  </div>

                  {outOfStockItems.map((item) => (
                    <div
                      key={`${item._id}_${item.variantId}_oos`}
                      className="flex items-center bg-red-50 border border-red-200 -mx-8 px-6 py-5 rounded"
                    >
                      <div className="flex w-2/5">
                        <div className="w-20">
                          <img
                            className="h-24 grayscale opacity-60"
                            src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                            alt={item.title || "Product"}
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col justify-between ml-4 flex-grow">
                          <span className="font-bold text-sm text-gray-700">{item.title || "Unknown Product"}</span>
                          <span className="text-red-500 text-xs">Size: {item.size || "N/A"}</span>
                          <span className="text-gray-500 text-xs">Seller: Mirakle</span>

                          {/* Out of stock message */}
                          <div className="bg-red-100 border border-red-300 rounded px-2 py-1 mt-1">
                            <span className="text-red-700 text-xs font-medium">
                              📦 {item.stockMessage || "Currently out of stock"}
                            </span>
                          </div>

                          <button
                            className="font-semibold hover:text-red-700 text-red-600 text-xs mt-2"
                            onClick={() =>
                              dispatch(
                                removeFromCart({
                                  _id: item._id,
                                  variantId: item.variantId,
                                }),
                              )
                            }
                          >
                            Remove from Cart
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-center w-1/5">
                        <span className="text-red-600 font-semibold text-sm bg-red-100 px-2 py-1 rounded">
                          OUT OF STOCK
                        </span>
                      </div>
                      <span className="text-center w-1/5 font-semibold text-sm text-gray-500 line-through">
                        ₹{(item.currentPrice || 0).toFixed(2)}
                      </span>
                      <span className="text-center w-1/5 font-semibold text-sm text-red-600">Unavailable</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <a href="/shop/allproduct" className="flex font-semibold text-indigo-600 text-sm mt-10">
            <svg className="fill-current mr-2 text-indigo-600 w-4" viewBox="0 0 448 512">
              <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z" />
            </svg>
            Continue Shopping
          </a>
        </div>

        <div id="summary" className="w-1/4 px-8 py-10">
          <h1 className="font-semibold text-2xl border-b pb-8">Price Detail's</h1>

          <div className="flex justify-between mt-10 mb-5">
            <span className="font-semibold text-sm uppercase">
              Price ({availableItems.length} available item{availableItems.length !== 1 ? "s" : ""})
            </span>
            <span className="font-semibold text-sm">₹{originalTotal.toFixed(2)}</span>
          </div>

          {outOfStockItems.length > 0 && (
            <div className="flex justify-between mb-5">
              <span className="font-semibold text-sm uppercase text-red-600">
                Out of Stock ({outOfStockItems.length})
              </span>
              <span className="font-semibold text-sm text-red-600">Excluded</span>
            </div>
          )}

          <div className="flex justify-between mb-5">
            <span className="text-sm">Discount</span>
            <span className="text-sm text-green-600">-₹{(originalTotal - subtotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between mb-5">
            <span className="text-sm">Delivery Charges</span>
            <span className="text-sm text-green-600">Free</span>
          </div>

          <hr className="my-4" />

          <div className="flex font-semibold justify-between py-6 text-lg">
            <span>Total Amount</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {hasOutOfStockItem && (
            <div className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded border border-red-200">
              <div className="font-medium mb-1">⚠️ Cannot proceed with checkout</div>
              <div>
                Remove {outOfStockItems.length} out of stock item{outOfStockItems.length > 1 ? "s" : ""} to continue
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/checkout")}
            disabled={availableItems.length === 0 || hasOutOfStockItem}
            className={`w-full py-3 text-sm font-semibold uppercase rounded transition-colors ${
              hasOutOfStockItem || availableItems.length === 0
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {hasOutOfStockItem
              ? "Remove Out of Stock Items"
              : availableItems.length === 0
                ? "Cart is Empty"
                : `PLACE ORDER (${availableItems.length} items)`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddToCart
