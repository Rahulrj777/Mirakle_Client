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
      const incomingItems = Array.isArray(action.payload)
        ? action.payload
        : action.payload && Array.isArray(action.payload.items)
          ? action.payload.items
          : []

      const aggregatedItems = []
      incomingItems.forEach((item) => {
        // Ensure _id and variantId are treated as strings for consistent comparison
        const existingItem = aggregatedItems.find(
          (i) =>
            String(i._id).trim() === String(item._id).trim() &&
            String(i.variantId).trim() === String(item.variantId).trim(),
        )

        if (existingItem) {
          existingItem.quantity += item.quantity
        } else {
          aggregatedItems.push({ ...item })
        }
      })
      state.items = aggregatedItems
      console.log("✅ Cart items set and aggregated in Redux:", state.items)
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
      localStorage.removeItem("deliveryAddress")
      console.log("✅ User cleared")
    },
    setCartReady: (state, action) => {
      state.cartReady = action.payload
    },
    addToCart: (state, action) => {
      const item = action.payload
      console.log("🛒 Adding to cart (Redux):", item)
      // Ensure _id and variantId are treated as strings for consistent comparison
      const existingItem = state.items.find((i) => {
        const isSameProduct = String(i._id).trim() === String(item._id).trim()
        const isSameVariant = String(i.variantId).trim() === String(item.variantId).trim()
        console.log("Redux: Comparing items:", {
          existing: { _id: i._id, variantId: i.variantId, size: i.size },
          new: { _id: item._id, variantId: item.variantId, size: item.size },
          isSameProduct,
          isSameVariant,
        })
        return isSameProduct && isSameVariant
      })

      if (existingItem) {
        console.log("✅ Redux: Found existing item, incrementing quantity")
        existingItem.quantity += item.quantity
      } else {
        console.log("✅ Redux: Adding new item to cart")
        state.items.push({
          ...item,
        })
      }
      console.log("Redux Cart after addition:", state.items)
    },
    incrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      const item = state.items.find(
        (item) =>
          String(item._id).trim() === String(_id).trim() && String(item.variantId).trim() === String(variantId).trim(),
      )
      if (item) {
        item.quantity += 1
        console.log("✅ Redux: Incremented quantity for", item.title, "variant:", item.variantId)
      }
    },
    decrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      const item = state.items.find(
        (item) =>
          String(item._id).trim() === String(_id).trim() && String(item.variantId).trim() === String(variantId).trim(),
      )
      if (item && item.quantity > 1) {
        item.quantity -= 1
        console.log("✅ Redux: Decremented quantity for", item.title, "variant:", item.variantId)
      }
    },
    removeFromCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload // ✅ Ensure variantId is passed for removal
      const initialLength = state.items.length
      // ✅ FIXED: Remove by both _id and variantId
      state.items = state.items.filter(
        (item) =>
          !(
            String(item._id).trim() === String(_id).trim() && String(item.variantId).trim() === String(variantId).trim()
          ),
      )
      console.log("✅ Redux: Removed item, cart size:", initialLength, "→", state.items.length)
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
