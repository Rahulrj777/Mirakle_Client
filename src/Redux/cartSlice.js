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
        const existingItem = aggregatedItems.find(
          (i) =>
            String(i._id).trim() === String(item._id).trim() &&
            String(i.variantId).trim() === String(item.variantId).trim(),
        )

        if (existingItem) {
          existingItem.quantity += item.quantity
          console.log(
            `Redux setCartItem: Aggregated existing item. Product ID: '${String(item._id).trim()}', Variant ID: '${String(item.variantId).trim()}', New Quantity: ${existingItem.quantity}`,
          )
        } else {
          aggregatedItems.push({ ...item })
          console.log(
            `Redux setCartItem: Added new item. Product ID: '${String(item._id).trim()}', Variant ID: '${String(item.variantId).trim()}'`,
          )
        }
      })
      state.items = aggregatedItems
      console.log("✅ Redux: Cart items set and aggregated in Redux:", state.items)
    },
    clearCart: (state) => {
      state.items = []
      console.log("✅ Redux: Cart cleared")
    },
    clearUser: (state) => {
      state.userId = null
      state.items = []
      state.cartReady = false
      state.addresses = []
      state.selectedAddress = null
      localStorage.removeItem("deliveryAddress")
      console.log("✅ Redux: User cleared")
    },
    setCartReady: (state, action) => {
      state.cartReady = action.payload
    },
    addToCart: (state, action) => {
      const item = action.payload
      console.log("--- Redux addToCart Start ---")
      console.log("🛒 Redux: Attempting to add item:", item)

      const existingItem = state.items.find((i) => {
        const isSameProduct = String(i._id).trim() === String(item._id).trim()
        const isSameVariant = String(i.variantId).trim() === String(item.variantId).trim()
        console.log(
          `Redux: Comparing existing item (Product ID: '${String(i._id).trim()}', Variant ID: '${String(i.variantId).trim()}') with new item (Product ID: '${String(item._id).trim()}', Variant ID: '${String(item.variantId).trim()}'). Match: Product=${isSameProduct}, Variant=${isSameVariant}`,
        )
        return isSameProduct && isSameVariant
      })

      if (existingItem) {
        console.log("✅ Redux: Found existing item, incrementing quantity.")
        existingItem.quantity += item.quantity
      } else {
        console.log("✅ Redux: Adding new item to cart.")
        state.items.push({
          ...item,
        })
      }
      console.log("Redux: Cart state after addition:", state.items)
      console.log("--- Redux addToCart End ---")
    },
    incrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      console.log(
        `Redux: Attempting to increment quantity for Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
      )
      const item = state.items.find(
        (item) =>
          String(item._id).trim() === String(_id).trim() && String(item.variantId).trim() === String(variantId).trim(),
      )
      if (item) {
        item.quantity += 1
        console.log("✅ Redux: Incremented quantity for", item.title, "variant:", item.variantId, "to", item.quantity)
      } else {
        console.warn(
          `Redux: Item not found for increment. Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
        )
      }
    },
    decrementQuantity: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      console.log(
        `Redux: Attempting to decrement quantity for Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
      )
      const item = state.items.find(
        (item) =>
          String(item._id).trim() === String(_id).trim() && String(item.variantId).trim() === String(variantId).trim(),
      )
      if (item && item.quantity > 1) {
        item.quantity -= 1
        console.log("✅ Redux: Decremented quantity for", item.title, "variant:", item.variantId, "to", item.quantity)
      } else if (item && item.quantity === 1) {
        console.log(
          `Redux: Quantity is 1, not decrementing. Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
        )
      } else {
        console.warn(
          `Redux: Item not found for decrement. Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
        )
      }
    },
    removeFromCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = []
        return
      }
      const { _id, variantId } = action.payload
      console.log(
        `Redux: Attempting to remove item. Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
      )
      const initialLength = state.items.length
      state.items = state.items.filter(
        (item) =>
          !(
            String(item._id).trim() === String(_id).trim() && String(item.variantId).trim() === String(variantId).trim()
          ),
      )
      if (state.items.length < initialLength) {
        console.log("✅ Redux: Item removed successfully. Cart size:", initialLength, "→", state.items.length)
      } else {
        console.warn(
          `Redux: Item not found for removal. Product ID: '${String(_id).trim()}', Variant ID: '${String(variantId).trim()}'`,
        )
      }
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
