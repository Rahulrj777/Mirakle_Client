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
  const [safeCartItems, setSafeCartItems] = useState([])
  const [hasOutOfStockItem, setHasOutOfStockItem] = useState(false)

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))
    } catch {
      return null
    }
  }, [])

  const userId = user?.user?.userId || user?.user?._id
  const token = user?.token

  useEffect(() => {
    if (cartItems) {
      setSafeCartItems(cartItems)
    }
  }, [cartItems])

  // FIXED: Enhanced stock checking function
  const isItemOutOfStock = (item) => {
    if (!item) return true

    // Check multiple conditions for out of stock
    const conditions = [
      item.isOutOfStock === true,
      typeof item.stock === "number" && item.stock <= 0,
      item.stock === "0",
      item.stock === 0,
    ]

    const isOOS = conditions.some((condition) => condition)
    console.log(`🔍 Stock check for ${item.title}:`, {
      isOutOfStock: item.isOutOfStock,
      stock: item.stock,
      stockType: typeof item.stock,
      finalResult: isOOS,
    })

    return isOOS
  }

  useEffect(() => {
    const outOfStock = safeCartItems.some((item) => isItemOutOfStock(item))
    setHasOutOfStockItem(outOfStock)
    console.log(
      `📊 Cart analysis: ${safeCartItems.length} total items, ${outOfStock ? "has" : "no"} out of stock items`,
    )
  }, [safeCartItems])

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

  useEffect(() => {
    if (user && userId && token) {
      getUserData()
    }
  }, [user, userId, token, dispatch])

  const syncCartWithStock = async () => {
    if (!cartReady || !token || !userId || safeCartItems.length === 0) return

    try {
      console.log("🔄 Syncing cart with current stock status...")

      const productIds = [...new Set(safeCartItems.map((item) => item._id))]

      const response = await axiosWithToken(token).post(`${API_BASE}/api/products/check-stock`, {
        productIds,
      })

      const currentProducts = response.data.products
      const stockUpdates = []

      safeCartItems.forEach((cartItem) => {
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

        const currentVariant = currentProduct.variants.find((v) => {
          return (
            v.size === cartItem.size ||
            (v.weight &&
              cartItem.weight &&
              v.weight.value === cartItem.weight.value &&
              v.weight.unit === cartItem.weight.unit)
          )
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

        // FIXED: Enhanced stock checking logic
        const isOutOfStock =
          currentProduct.isOutOfStock === true ||
          currentVariant.isOutOfStock === true ||
          (typeof currentVariant.stock === "number" && currentVariant.stock <= 0) ||
          currentVariant.stock === "0" ||
          currentVariant.stock === 0

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

      dispatch(updateCartItemsStock(stockUpdates))

      const outOfStockCount = stockUpdates.filter((update) => update.isOutOfStock).length
      if (outOfStockCount > 0) {
        console.log(`⚠️ ${outOfStockCount} items in cart are now out of stock`)
      }
    } catch (error) {
      console.error("❌ Failed to sync cart with stock:", error)
    }
  }

  useEffect(() => {
    if (cartReady && token && userId) {
      syncCartWithStock()

      const interval = setInterval(() => {
        if (!document.hidden) {
          syncCartWithStock()
        }
      }, 30000)

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          syncCartWithStock()
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)

      return () => {
        clearInterval(interval)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }
  }, [cartReady, token, userId, safeCartItems.length])

  const availableItems = useMemo(() => {
    return safeCartItems.filter((item) => !isItemOutOfStock(item))
  }, [safeCartItems])

  const outOfStockItems = useMemo(() => {
    return safeCartItems.filter((item) => isItemOutOfStock(item))
  }, [safeCartItems])

  const subtotal = useMemo(() => {
    return availableItems.reduce((acc, item) => acc + (item.currentPrice || 0) * (item.quantity || 0), 0)
  }, [availableItems])

  const originalTotal = useMemo(() => {
    return availableItems.reduce((acc, item) => acc + (item.originalPrice || 0) * (item.quantity || 0), 0)
  }, [availableItems])

  return (
    <div className="container mx-auto mt-10">
      <div className="flex shadow-md my-10">
        <div className="w-3/4 bg-white px-10 py-10">
          <div className="flex justify-between border-b pb-8">
            <h1 className="font-semibold text-2xl">Shopping Cart</h1>
            <h2 className="font-semibold text-2xl">{safeCartItems?.length} Items</h2>
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
                      {typeof item.stock === "number" && item.stock <= 10 && (
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
                      className="fill-current text-gray-600 w-3 cursor-pointer"
                      viewBox="0 0 448 512"
                      onClick={() =>
                        dispatch(
                          incrementQuantity({
                            _id: item._id,
                            variantId: item.variantId,
                          }),
                        )
                      }
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
                      className="flex items-center hover:bg-red-50 -mx-8 px-6 py-5 opacity-75"
                    >
                      <div className="flex w-2/5">
                        <div className="w-20">
                          <img
                            className="h-24 grayscale"
                            src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                            alt={item.title || "Product"}
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col justify-between ml-4 flex-grow">
                          <span className="font-bold text-sm text-gray-600">{item.title || "Unknown Product"}</span>
                          <span className="text-red-500 text-xs">Size: {item.size || "N/A"}</span>
                          <span className="text-gray-500 text-xs">Seller: Mirakle</span>

                          {/* Out of stock message */}
                          <div className="bg-red-100 border border-red-200 rounded px-2 py-1 mt-1">
                            <span className="text-red-600 text-xs font-medium">
                              📦 {item.stockMessage || "Currently out of stock"}
                            </span>
                          </div>

                          <button
                            className="font-semibold hover:text-red-700 text-red-500 text-xs mt-2"
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
                        <span className="text-red-600 font-semibold text-sm">Out of Stock</span>
                      </div>
                      <span className="text-center w-1/5 font-semibold text-sm text-gray-500">
                        ₹{(item.currentPrice || 0).toFixed(2)}
                      </span>
                      <span className="text-center w-1/5 font-semibold text-sm text-gray-500">-</span>
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
          <h1 className="font-semibold text-2xl border-b pb-8">Order Summary</h1>

          <div className="flex justify-between mt-10 mb-5">
            <span className="font-semibold text-sm uppercase">Available Items ({availableItems.length})</span>
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

          <div>
            <label className="font-medium inline-block mb-3 text-sm uppercase">Shipping</label>
            <select className="block p-2 text-gray-600 w-full text-sm">
              <option>Free shipping</option>
            </select>
          </div>

          <div className="py-10">
            <label htmlFor="promo" className="font-semibold inline-block mb-3 text-sm uppercase">
              Promo Code
            </label>
            <input type="text" id="promo" placeholder="Enter your code" className="p-2 text-sm w-full" />
          </div>
          <button className="bg-red-500 hover:bg-red-600 px-5 py-2 text-sm text-white uppercase">Apply</button>

          <div className="border-t mt-8">
            <div className="flex font-semibold justify-between py-6 text-sm uppercase">
              <span>Total cost</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {hasOutOfStockItem && (
              <div className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">
                Remove out of stock items to continue
              </div>
            )}

            <button
              onClick={() => navigate("/checkout")}
              disabled={availableItems.length === 0 || hasOutOfStockItem}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 text-sm font-semibold uppercase rounded transition-colors"
            >
              {hasOutOfStockItem ? "Remove Out of Stock Items" : `Place Order (${availableItems.length} items)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddToCart
