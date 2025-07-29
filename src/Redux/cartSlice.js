import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  items: [],
  cartReady: false,
  userId: null,
  addresses: [],
  selectedAddress: null,
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload
    },
    setCartItem: (state, action) => {
      const payload = action.payload
      if (Array.isArray(payload)) {
        state.items = payload
      } else if (payload && Array.isArray(payload.items)) {
        state.items = payload.items
      } else if (payload && typeof payload === "object" && payload.items) {
        state.items = Array.isArray(payload.items) ? payload.items : []
      } else {
        state.items = []
      }
      console.log("✅ Cart items set:", state.items)
    },
    updateCartItemsStock: (state, action) => {
      const stockUpdates = action.payload 

      state.items = state.items.map((item) => {
        const stockUpdate = stockUpdates.find(
          (update) => update._id === item._id && update.variantId === item.variantId,
        )

        if (stockUpdate) {
          return {
            ...item,
            isOutOfStock: stockUpdate.isOutOfStock,
            stock: stockUpdate.stock,
            stockMessage: stockUpdate.stockMessage,
            originalPrice: stockUpdate.originalPrice || item.originalPrice,
            currentPrice: stockUpdate.currentPrice || item.currentPrice,
            discountPercent: stockUpdate.discountPercent || item.discountPercent,
          }
        }
        return item
      })
      console.log("✅ Cart stock status updated")
    },
    clearCart: (state) => {
      state.items = []
      console.log("✅ Cart cleared")
    },
    clearUser: (state) => {
      state.userId = null
      state.items = []
      state.cartReady = false
      state.addresses = []
      state.selectedAddress = null
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("cart_") || key === "deliveryAddress") {
          localStorage.removeItem(key)
        }
      })
      console.log("✅ User cleared and localStorage cleaned")
    },
    setCartReady: (state, action) => {
      state.cartReady = action.payload
    },
    addToCart: (state, action) => {
      const item = action.payload
      console.log("🛒 Adding to cart:", item)

      if (!Array.isArray(state.items)) {
        state.items = []
      }

      const existingItem = state.items.find((i) => {
        const isSameProduct = i._id.toString() === item._id.toString()
        const isSameVariant = i.variantId?.toString() === item.variantId?.toString()
        return isSameProduct && isSameVariant
      })

      if (existingItem) {
        console.log("✅ Found existing item, incrementing quantity")
        existingItem.quantity += item.quantity
      } else {
        console.log("✅ Adding new item to cart")
        state.items.push({
          ...item,
          quantity: item.quantity || 1,
          isOutOfStock: item.isOutOfStock || false,
          stock: item.stock,
          stockMessage: item.stockMessage || null,
        })
      }
      console.log("Cart after addition:", state.items)
    },
    incrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      const item = state.items.find(
        (item) => item._id.toString() === _id.toString() && item.variantId?.toString() === variantId?.toString(),
      )
      if (item && !item.isOutOfStock) {

        if (typeof item.stock === "number" && item.quantity >= item.stock) {
          console.log("⚠️ Cannot increment - stock limit reached")
          return
        }
        item.quantity += 1
        console.log("✅ Incremented quantity for", item.title, "variant:", item.variantId)
      }
    },
    decrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      const item = state.items.find(
        (item) => item._id.toString() === _id.toString() && item.variantId?.toString() === variantId?.toString(),
      )
      if (item && item.quantity > 1) {
        item.quantity -= 1
        console.log("✅ Decremented quantity for", item.title, "variant:", item.variantId)
      }
    },
    removeFromCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      const initialLength = state.items.length
      state.items = state.items.filter(
        (item) => !(item._id.toString() === _id.toString() && item.variantId?.toString() === variantId?.toString()),
      )
      console.log("✅ Removed item, cart size:", initialLength, "→", state.items.length)
    },
    addAddress: (state, action) => {
      state.addresses.push(action.payload)
    },
    setAddresses: (state, action) => {
      state.addresses = action.payload
    },
    selectAddress: (state, action) => {
      state.selectedAddress = action.payload
    },
    initializeSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload
    },
  },
})

export const {
  setUserId,
  setCartItem,
  updateCartItemsStock,
  clearCart,
  clearUser,
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  setCartReady,
  addAddress,
  setAddresses,
  selectAddress,
  initializeSelectedAddress,
} = cartSlice.actions

export default cartSlice.reducer
