import { createSlice } from "@reduxjs/toolkit";

// Try to load persisted cart
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
    setCart: (state, action) => {
      // Replace cart completely
      return action.payload;
    },
    addToCart: (state, action) => {
      const existingIndex = state.findIndex(item => item._id === action.payload._id);
      if (existingIndex !== -1) {
        state[existingIndex].quantity += 1;
      } else {
        state.push({ ...action.payload });
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.find((item) => item._id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementQuantity: (state, action) => {
      const item = state.find((item) => item._id === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
    },
    removeFromCart: (state, action) =>
      state.filter((item) => item._id !== action.payload),
    clearCart: () => [],
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
