import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  cartReady: false,
  userId: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState, 
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setCartItem: (state, action) => {
      state.items = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCartReady: (state, action) => {
      state.cartReady = action.payload;
    },
    addToCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      const existingItem = state.items.find(item => item._id === action.payload._id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.items.find(item => item._id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementQuantity: (state, action) => {
      const item = state.items.find(item => item._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item._id !== action.payload);
    },
  },
});

export const {
  setUserId,
  setCartItem,
  clearCart,
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  setCartReady,
} = cartSlice.actions;

export default cartSlice.reducer