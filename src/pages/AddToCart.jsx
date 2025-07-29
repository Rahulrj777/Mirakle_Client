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
import { useUser } from "@clerk/clerk-react"
import { axiosWithToken } from "../utils/axios"
import { API_BASE } from "../api"

const AddToCart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector((state) => state.cart.cartItems)
  const [cartReady, setCartReady] = useState(false)
  const [safeCartItems, setSafeCartItems] = useState([])
  const [hasOutOfStockItem, setHasOutOfStockItem] = useState(false)
  const { isSignedIn, user } = useUser()
  const userId = user?.id
  const token = localStorage.getItem("token")

  useEffect(() => {
    if (cartItems) {
      setSafeCartItems(cartItems)
    }
  }, [cartItems])

  const isItemOutOfStock = (item) => {
    return item.isOutOfStock === true
  }

  useEffect(() => {
    const outOfStock = safeCartItems.some((item) => isItemOutOfStock(item))
    setHasOutOfStockItem(outOfStock)
  }, [safeCartItems])

  const getUserData = async () => {
    if (!isSignedIn || !userId) return

    try {
      const response = await axiosWithToken(token).get(`${API_BASE}/api/users/${userId}`)
      const userData = response.data

      if (userData && userData.addresses) {
        dispatch(setAddresses(userData.addresses))
        const storedSelectedAddress = localStorage.getItem("selectedAddress")
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
    if (isSignedIn && userId && token) {
      getUserData()
    }
  }, [isSignedIn, userId, token, dispatch])

  // Add this function after getUserData
  const syncCartWithStock = async () => {
    if (!cartReady || !token || !userId || safeCartItems.length === 0) return

    try {
      console.log("🔄 Syncing cart with current stock status...")

      // Get unique product IDs from cart
      const productIds = [...new Set(safeCartItems.map((item) => item._id))]

      // Check current stock status
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

        // Find matching variant
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

        // Check stock status
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

      // Update cart with stock status
      dispatch(updateCartItemsStock(stockUpdates))

      const outOfStockCount = stockUpdates.filter((update) => update.isOutOfStock).length
      if (outOfStockCount > 0) {
        console.log(`⚠️ ${outOfStockCount} items in cart are now out of stock`)
      }
    } catch (error) {
      console.error("❌ Failed to sync cart with stock:", error)
    }
  }

  // Add this useEffect after the existing ones
  useEffect(() => {
    if (cartReady && token && userId) {
      // Initial sync
      syncCartWithStock()

      // Sync every 30 seconds when tab is active
      const interval = setInterval(() => {
        if (!document.hidden) {
          syncCartWithStock()
        }
      }, 30000)

      // Sync when tab becomes visible
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

  // Replace the existing cart items mapping with this:
  const availableItems = useMemo(() => {
    return safeCartItems.filter((item) => !isItemOutOfStock(item))
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
              {safeCartItems
                .filter((item) => !isItemOutOfStock(item))
                .map((item) => (
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

                      {/* Stock warning for low stock */}
                      {!isItemOutOfStock(item) && typeof item.stock === "number" && item.stock <= 10 && (
                        <p className="text-orange-600 text-xs mb-2">⚡ Only {item.stock} left in stock</p>
                      )}

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
                            onClick={() =>
                              dispatch(
                                decrementQuantity({
                                  _id: item._id,
                                  variantId: item.variantId,
                                }),
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="px-4">{item.quantity || 0}</span>
                          <button
                            className="px-3 py-1 text-lg hover:bg-gray-100"
                            onClick={() =>
                              dispatch(
                                incrementQuantity({
                                  _id: item._id,
                                  variantId: item.variantId,
                                }),
                              )
                            }
                            disabled={typeof item.stock === "number" ? item.quantity >= item.stock : false}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="text-red-500 text-sm hover:underline"
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
                  </div>
                ))}

              {/* Out of Stock Items Section */}
              {safeCartItems.filter((item) => isItemOutOfStock(item)).length > 0 && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h3 className="text-red-800 font-medium mb-2">⚠️ Out of Stock Items</h3>
                    <p className="text-red-600 text-sm">
                      The following items are currently unavailable. Remove them to continue with your order.
                    </p>
                  </div>

                  {safeCartItems
                    .filter((item) => isItemOutOfStock(item))
                    .map((item) => (
                      <div
                        key={`${item._id}_${item.variantId}`}
                        className="bg-white rounded shadow p-4 flex gap-4 opacity-75"
                      >
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

                          {/* Out of stock alert */}
                          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-red-600 font-medium text-sm">
                              📦 {item.stockMessage || "This item is currently out of stock"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-bold text-xl">
                              ₹{(item.currentPrice || 0).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-4">
                            <span className="text-red-600 font-semibold">Out of Stock</span>
                            <button
                              className="text-red-500 text-sm hover:underline"
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
            <span className="font-semibold text-sm uppercase">Items {safeCartItems?.length}</span>
            <span className="font-semibold text-sm">{subtotal.toFixed(2)}</span>
          </div>
          <div>
            <label className="font-medium inline-block mb-3 text-sm uppercase">Shipping</label>
            <select className="block p-2 text-gray-600 w-full text-sm">
              <option>Standard shipping - $10.00</option>
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
            <div className="flex justify-between mt-8">
              <span>
                Price ({availableItems.length} available item{availableItems.length > 1 ? "s" : ""})
              </span>
              <span>₹{originalTotal.toFixed(2)}</span>
            </div>

            {/* Add this after the existing price details */}
            {safeCartItems.filter((item) => isItemOutOfStock(item)).length > 0 && (
              <div className="text-red-500 text-sm my-2 text-center">
                {safeCartItems.filter((item) => isItemOutOfStock(item)).length} out of stock item(s) excluded from total
              </div>
            )}

            <div className="flex font-semibold justify-between py-6 text-sm uppercase">
              <span>Total cost</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {/* Update the Place Order button */}
            <button
              onClick={() => navigate("/checkout")}
              disabled={availableItems.length === 0 || hasOutOfStockItem}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded font-semibold"
            >
              PLACE ORDER ({availableItems.length} items)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddToCart
