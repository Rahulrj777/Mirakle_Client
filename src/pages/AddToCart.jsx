import { useEffect, useState, useMemo, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  removeFromCart,
  selectAddress,
  setAddresses,
  initializeSelectedAddress,
  setCartItem,
  incrementQuantity,
  decrementQuantity,
  addAddress,
} from "../Redux/cartSlice"
import { axiosWithToken } from "../utils/axiosWithToken"
import { API_BASE } from "../utils/api"

const AddToCart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const modalRef = useRef()
  const syncTimeoutRef = useRef(null)

  const cartItems = useSelector((state) => {
    const items = state.cart?.items
    return Array.isArray(items) ? items : []
  })

  const addresses = useSelector((state) => state.cart?.addresses || [])
  const selectedAddress = useSelector((state) => state.cart?.selectedAddress)
  const [cartReady, setCartReady] = useState(false)
  const [setStockSyncLoading] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressesLoaded, setAddressesLoaded] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    landmark: "",
    pincode: "",
  });

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))
    } catch {
      return null
    }
  }, [])

  const userId = user?.user?.userId || user?.user?._id
  const token = user?.token

  const isItemOutOfStock = (item) => {
    if (!item) return true

    if (item.stock === undefined && item.isOutOfStock === undefined && item.stockMessage === undefined) {
      return false 
    }

    if (item.isOutOfStock === true) return true

    if (typeof item.stock === "number" && item.stock <= 0) return true

    if (item.stock === "0") return true

    if (item.stockMessage) {
      const message = item.stockMessage.toLowerCase()
      if (
        message.includes("out of stock") ||
        message.includes("unavailable") ||
        message.includes("no longer available")
      ) {
        return true
      }
    }

    return false
  }

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

  const syncCartFromBackend = async () => {
    if (!token || !userId) {
      setCartReady(true)
      return
    }

    try {
      console.log("🔄 Syncing cart from backend...")
      const response = await axiosWithToken(token).get(`${API_BASE}/api/cart`)
      const backendCart = response.data

      let cartItemsArray = []
      if (backendCart && Array.isArray(backendCart.items)) {
        cartItemsArray = backendCart.items
      } else if (Array.isArray(backendCart)) {
        cartItemsArray = backendCart
      }

      console.log("📦 Raw cart from backend:", cartItemsArray)

      // If we have cart items but they lack stock info, sync with products
      if (cartItemsArray.length > 0) {
        const enrichedCartItems = await enrichCartItemsWithStock(cartItemsArray)
        dispatch(setCartItem(enrichedCartItems))
        localStorage.setItem(`cart_${userId}`, JSON.stringify(enrichedCartItems))
        console.log("✅ Cart synced and enriched with stock info")
      } else {
        dispatch(setCartItem([]))
        console.log("✅ Empty cart synced")
      }
    } catch (error) {
      console.error("❌ Failed to sync cart from backend:", error)
      // Try to load from localStorage as fallback
      const localCart = localStorage.getItem(`cart_${userId}`)
      if (localCart) {
        try {
          const parsedCart = JSON.parse(localCart)
          if (Array.isArray(parsedCart)) {
            const enrichedCartItems = await enrichCartItemsWithStock(parsedCart)
            dispatch(setCartItem(enrichedCartItems))
          }
        } catch (parseError) {
          console.error("Failed to parse local cart:", parseError)
          dispatch(setCartItem([]))
        }
      } else {
        dispatch(setCartItem([]))
      }
    } finally {
      setCartReady(true)
    }
  }

  // Function to enrich cart items with current stock information
  const enrichCartItemsWithStock = async (cartItemsArray) => {
    try {
      console.log("🔍 Enriching cart items with stock info...")
      const productsResponse = await axiosWithToken(token).get(`${API_BASE}/api/products/all-products`)
      const allProducts = productsResponse.data

      const enrichedItems = cartItemsArray.map((cartItem) => {
        const currentProduct = allProducts.find((p) => p._id === cartItem._id)

        if (!currentProduct) {
          console.log(`❌ Product not found: ${cartItem.title}`)
          return {
            ...cartItem,
            isOutOfStock: true,
            stock: 0,
            stockMessage: "Product no longer available",
          }
        }

        const currentVariant = currentProduct.variants?.find((v) => v.size === cartItem.size)

        if (!currentVariant) {
          console.log(`❌ Variant not found: ${cartItem.title} - ${cartItem.size}`)
          return {
            ...cartItem,
            isOutOfStock: true,
            stock: 0,
            stockMessage: "Variant no longer available",
          }
        }

        // Determine if out of stock
        const isOutOfStock =
          currentProduct.isOutOfStock === true ||
          currentVariant.isOutOfStock === true ||
          (typeof currentVariant.stock === "number" && currentVariant.stock <= 0) ||
          currentVariant.stock === "0" ||
          currentVariant.stock === 0

        const enrichedItem = {
          ...cartItem,
          isOutOfStock,
          stock: currentVariant.stock,
          stockMessage: isOutOfStock ? "Currently out of stock" : null,
          originalPrice: currentVariant.price,
          discountPercent: currentVariant.discountPercent || 0,
          currentPrice: currentVariant.price - (currentVariant.price * (currentVariant.discountPercent || 0)) / 100,
        }

        console.log(`✅ Enriched ${cartItem.title}:`, {
          stock: enrichedItem.stock,
          isOutOfStock: enrichedItem.isOutOfStock,
          stockMessage: enrichedItem.stockMessage,
        })

        return enrichedItem
      })

      return enrichedItems
    } catch (error) {
      console.error("❌ Failed to enrich cart items with stock:", error)
      // Return original items if enrichment fails
      return cartItemsArray
    }
  }

  // Fix cart persistence - sync with backend on load
  useEffect(() => {
    syncCartFromBackend()
  }, [token, userId, dispatch])

  // Load addresses
  useEffect(() => {
    if (!cartReady || !token || !userId || addressesLoaded) return
    setAddressesLoading(true)
    axiosWithToken(token)
      .get(`${API_BASE}/api/users/address`)
      .then((res) => {
        if (Array.isArray(res.data.addresses)) {
          dispatch(setAddresses(res.data.addresses))
          setAddressesLoaded(true)
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

  // Stock sync using existing product API - Enhanced version
  const syncCartWithStock = async () => {
    if (!cartReady || !token || !userId || cartItems.length === 0) return

    try {
      setStockSyncLoading(true)
      console.log("🔄 Manual stock sync initiated...")

      const enrichedCartItems = await enrichCartItemsWithStock(cartItems)
      dispatch(setCartItem(enrichedCartItems))
      localStorage.setItem(`cart_${userId}`, JSON.stringify(enrichedCartItems))

      console.log("✅ Manual stock sync completed")
    } catch (error) {
      console.error("❌ Manual stock sync failed:", error)
    } finally {
      setStockSyncLoading(false)
    }
  }

  // Debounced cart sync to backend
  useEffect(() => {
    if (!cartReady || !token || !userId) return
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems))
      axiosWithToken(token)
        .post(`${API_BASE}/api/cart`, { items: cartItems })
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
  }, [cartItems, cartReady, token, userId])

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

  const handleManualStockSync = () => {
    syncCartWithStock()
  }

  const handleRemoveItem = async (item) => {
    try {
      dispatch(removeFromCart({ _id: item._id, variantId: item.variantId }))
      const updatedCart = cartItems.filter(
        (cartItem) => !(cartItem._id === item._id && cartItem.variantId === item.variantId),
      )
      localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCart))
      if (token) {
        try {
          await axiosWithToken(token).delete(`${API_BASE}/api/cart/item`, {
            data: { _id: item._id, variantId: item.variantId },
          })
        } catch (syncError) {
          console.warn("Failed to sync removal with backend:", syncError)
        }
      }
    } catch (error) {
      console.error("Failed to remove item:", error)
    }
  }

  // Enhanced debug logging
  useEffect(() => {
    console.log("=== ENHANCED CART STOCK DEBUG ===")
    cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}: ${item.title}`)
    })
    console.log(`Available items: ${availableItems.length}`)
    console.log(`Out of stock items: ${outOfStockItems.length}`)
    console.log("================================")
  }, [cartItems, availableItems, outOfStockItems])

  const handleQuantityChange = async (item, action) => {
    try {
      if (action === "increment") {
        if (typeof item.stock === "number" && item.quantity >= item.stock) {
          alert("Cannot add more items. Stock limit reached.")
          return
        }
        dispatch(incrementQuantity({ _id: item._id, variantId: item.variantId }))
      } else if (action === "decrement") {
        if (item.quantity <= 1) {
          return
        }
        dispatch(decrementQuantity({ _id: item._id, variantId: item.variantId }))
      }

      // Sync with backend
      if (token) {
        const newQuantity = action === "increment" ? item.quantity + 1 : item.quantity - 1
        try {
          await axiosWithToken(token).patch(`${API_BASE}/api/cart/update-quantity`, {
            _id: item._id,
            variantId: item.variantId,
            quantity: newQuantity,
          })
        } catch (syncError) {
          console.warn("Failed to sync quantity change with backend:", syncError)
        }
      }
    } catch (error) {
      console.error("Failed to update quantity:", error)
    }
  }

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

  const handleEditAddress = (addr) => {
    setForm({
      name: addr.name || "",
      phone: addr.phone || "",
      house: (addr.line1?.split(",")[0] ?? "").trim(),
      street: (addr.line1?.split(",")[1] ?? "").trim(),
      city: addr.city || "",
      landmark: addr.landmark || "",
      pincode: addr.pincode || "",
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

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

  const handleSaveAddress = async (e) => {
      e.preventDefault();
      console.log("Saving address...");
  
      const newAddress = {
        name: form.name,
        phone: form.phone,
        line1: `${form.house}, ${form.street}`,
        city: form.city,
        pincode: form.pincode,
        landmark: form.landmark,
        type: "HOME",
      };
  
      try {
        const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
        if (!token) {
          alert("Login required");
          return;
        }
  
        // Determine if we are editing or adding
        const method = editingAddressId ? "PUT" : "POST";
        const url = editingAddressId
          ? `${API_BASE}/api/users/address/${editingAddressId}`
          : `${API_BASE}/api/users/address`;
  
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAddress),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          const updatedAddress =
            method === "POST"
              ? data.addresses[data.addresses.length - 1] // new one
              : data.addresses.find((a) => a._id === editingAddressId); // edited one
  
          // Update Redux and LocalStorage
          dispatch(addAddress(updatedAddress));
          dispatch(selectAddress(updatedAddress));
          localStorage.setItem("deliveryAddress", JSON.stringify(updatedAddress));
  
          // Reset editing state and close modal
          setEditingAddressId(null);
          setShowAddressForm(false);
  
          if (!editingAddressId) {
            navigate("/addtocart"); // only redirect on add
          }
        } else {
          throw new Error(data.message || "Failed to save address");
        }
      } catch (err) {
        console.error("Failed to save address:", err);
        alert("Could not save address");
      }
    };
    console.log("handleSaveAddress is", typeof handleSaveAddress);

  if (!cartReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cart and syncing stock...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Shopping Cart Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">Review your items and proceed to checkout</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Address Section */}
            <div className="bg-white p-4 rounded shadow flex justify-between items-center mb-4">
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
                    <p className="text-md">
                      {selectedAddress.phone}
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
                            {/* Product Image - Clickable */}
                            <div className="flex-shrink-0">
                              <img
                                className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                src={
                                  item.images?.main ||
                                  item.images?.others?.[0]?.url ||
                                  "/placeholder.svg?height=80&width=80"
                                }
                                alt={item.title || "Product"}
                                loading="lazy"
                                onClick={() => navigate(`/product/${item._id}`)}
                              />
                            </div>
                            {/* Product Details - Clickable title */}
                            <div className="flex-1 min-w-0">
                              <h4
                                className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => navigate(`/product/${item._id}`)}
                              >
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
                            {/* Centered Quantity Controls */}
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center border rounded-lg">
                                <button
                                  className="px-3 py-2 text-lg hover:bg-gray-100 transition-colors"
                                  onClick={() => handleQuantityChange(item, "decrement")}
                                  disabled={item.quantity <= 1}
                                >
                                  −
                                </button>
                                <span className="px-4 py-2 font-medium">{item.quantity || 0}</span>
                                <button
                                  className="px-3 py-2 text-lg hover:bg-gray-100 transition-colors"
                                  onClick={() => handleQuantityChange(item, "increment")}
                                  disabled={typeof item.stock === "number" ? item.quantity >= item.stock : false}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {/* Price */}
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                ₹{((item.currentPrice || 0) * (item.quantity || 0)).toFixed(2)}
                              </div>
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
                            {/* Product Image - Clickable */}
                            <div className="flex-shrink-0">
                              <img
                                className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity grayscale opacity-60"
                                src={
                                  item.images?.main ||
                                  item.images?.others?.[0]?.url ||
                                  "/placeholder.svg?height=80&width=80"
                                }
                                alt={item.title || "Product"}
                                loading="lazy"
                                onClick={() => navigate(`/product/${item._id}`)}
                              />
                            </div>
                            {/* Product Details - Clickable title */}
                            <div className="flex-1 min-w-0">
                              <h4
                                className="font-semibold text-gray-700 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => navigate(`/product/${item._id}`)}
                              >
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
                            {/* Centered Out of Stock Badge */}
                            <div className="flex flex-col items-center">
                              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium text-sm">
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

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-y-auto z-50">
          <div ref={modalRef} className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            {showAddressForm ? (
              // Render your address form here
              <form onSubmit={handleSaveAddress} className="space-y-3">
                <h2 className="text-xl font-bold mb-4">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h2>
                <input
                  name="name"
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  value={form.name}
                  placeholder="Name"
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  name="phone"
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  value={form.phone}
                  placeholder="Phone"
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  name="house"
                  onChange={(e) => setForm({...form, house: e.target.value})}
                  value={form.house}
                  placeholder="House / Flat"
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  name="street"
                  onChange={(e) => setForm({...form, street: e.target.value})}
                  value={form.street}
                  placeholder="Street"
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  name="city"
                  onChange={(e) => setForm({...form, city: e.target.value})}
                  value={form.city}
                  placeholder="City"
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  name="landmark"
                  onChange={(e) => setForm({...form, landmark: e.target.value})}
                  value={form.landmark}
                  placeholder="Landmark (optional)"
                  className="w-full p-2 border rounded"
                />
                <input
                  name="pincode"
                  onChange={(e) => setForm({...form, pincode: e.target.value})}
                  value={form.pincode}
                  placeholder="Pincode"
                  className="w-full p-2 border rounded"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded w-full"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded w-full"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Your existing address list UI
              <>
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
                      <p className="text-sm text-gray-600">{addr.phone}</p>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="text-blue-500 text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(addr._id)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </div>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AddToCart
