// src/Redux/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: [],
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existing = state.find(item => item._id === product._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.push({ ...product, quantity: 1 });
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.find(item => item._id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementQuantity: (state, action) => {
      const item = state.find(item => item._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      } else {
        return state.filter(item => item._id !== action.payload);
      }
    },
    removeFromCart: (state, action) =>
      state.filter(item => item._id !== action.payload),
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
