// cartSlice.js
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
  initialState: getInitialCart(),
  reducers: {
    addToCart: (state, action) => {
      const existing = state.find((item) => item._id === action.payload._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.push({ ...action.payload, quantity: 1 });
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.find((item) => item._id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementQuantity: (state, action) => {
      const item = state.find((item) => item._id === action.payload);
      if (item.quantity > 1) item.quantity -= 1;
    },
    removeFromCart: (state, action) =>
      state.filter((item) => item._id !== action.payload),
    clearCart: () => [],
  },
});

export const {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
