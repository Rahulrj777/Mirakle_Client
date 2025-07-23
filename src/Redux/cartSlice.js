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
    clearCart: (state) => {
      state.items = []
      console.log("✅ Cart cleared")
    },
    clearUser: (state) => {
      state.userId = null
      state.items = []
      state.cartReady = false
      // Clear address data when user logs out
      state.addresses = []
      state.selectedAddress = null
      localStorage.removeItem("deliveryAddress")
      console.log("✅ User cleared")
    },
    setCartReady: (state, action) => {
      state.cartReady = action.payload
    },
    addToCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        console.warn("⚠️ Cart items was not an array, resetting to empty array")
        state.items = []
      }
      const newItem = action.payload
      console.log("🛒 Adding to cart:", newItem)

      const existingItemIndex = state.items.findIndex(
        (item) => item._id === newItem._id && item.variantId === newItem.variantId,
      )
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += newItem.quantity || 1
        console.log("✅ Updated existing item quantity")
      } else {
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
      const { _id, variantId } = action.payload
      const item = state.items.find((item) => item._id === _id && item.variantId === variantId)
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
      const { _id, variantId } = action.payload
      const item = state.items.find((item) => item._id === _id && item.variantId === variantId)
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
    addAddress: (state, action) => {
      state.addresses.push(action.payload)
    },
    setAddresses: (state, action) => {
      state.addresses = action.payload
    },
    // Remove localStorage side effect from reducer - handle in component
    selectAddress: (state, action) => {
      state.selectedAddress = action.payload
    },
    // Add new action to initialize selected address from localStorage
    initializeSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload
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
  addAddress,
  setAddresses,
  selectAddress,
  initializeSelectedAddress,
} = cartSlice.actions

export default cartSlice.reducer
