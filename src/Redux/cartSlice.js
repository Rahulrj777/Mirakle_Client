import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  items: [], // Always ensure this is an array
  cartReady: false,
  userId: null,
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload
    },
    setCartItem: (state, action) => {
      // ✅ CRITICAL FIX: Always ensure items is an array
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
    clearCart: (state) => {
      state.items = []
      console.log("✅ Cart cleared")
    },
    clearUser: (state) => {
      state.userId = null
      state.items = []
      state.cartReady = false
      console.log("✅ User cleared")
    },
    setCartReady: (state, action) => {
      state.cartReady = action.payload
    },
    addToCart: (state, action) => {
      // ✅ CRITICAL FIX: Ensure items is always an array before operations
      if (!Array.isArray(state.items)) {
        console.warn("⚠️ Cart items was not an array, resetting to empty array")
        state.items = []
      }

      const newItem = action.payload
      console.log("🛒 Adding to cart:", newItem)

      // Find existing item with same product ID and variant ID
      const existingItemIndex = state.items.findIndex(
        (item) => item._id === newItem._id && item.variantId === newItem.variantId,
      )

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        state.items[existingItemIndex].quantity += newItem.quantity || 1
        console.log("✅ Updated existing item quantity")
      } else {
        // Add new item
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1,
        })
        console.log("✅ Added new item to cart")
      }

      console.log("🛒 Cart now has", state.items.length, "items")
    },
    incrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const item = state.items.find((item) => item._id === action.payload)
      if (item) {
        item.quantity += 1
        console.log("✅ Incremented quantity for", item.title)
      }
    },
    decrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const item = state.items.find((item) => item._id === action.payload)
      if (item && item.quantity > 1) {
        item.quantity -= 1
        console.log("✅ Decremented quantity for", item.title)
      }
    },
    removeFromCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const initialLength = state.items.length
      state.items = state.items.filter((item) => item._id !== action.payload)
      console.log("✅ Removed item, cart size:", initialLength, "→", state.items.length)
    },
  },
})

export const {
  setUserId,
  setCartItem,
  clearCart,
  clearUser,
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  setCartReady,
} = cartSlice.actions

export default cartSlice.reducer
