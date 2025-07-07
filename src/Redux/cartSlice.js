import { createSlice } from "@reduxjs/toolkit";

const getInitialCart = () => {
  const saved = localStorage.getItem("persist:cart");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return JSON.parse(parsed.cart || "[]");
    } catch (e) {
      console.error("Failed to parse persisted cart", e);
      return [];
    }
  }
  return [];
};

const cartSlice = createSlice({
  name: "cart",
  initialState: [],
  reducers: {
    setCart: (state, action) => action.payload,
    clearCart: () => [],
    addToCart: (state, action) => { /* your logic */ },
  },
});


export const {
  setCart,           // ✅ NEW - used after login to sync from backend
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
