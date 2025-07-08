import { createSlice } from "@reduxjs/toolkit";
import { axiosWithToken } from "../utils/axiosWithToken";

const initialState = {
  items: [],
  userId: null
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },

    setCartItems: (state, action) => {
      state.items = action.payload;
    },

    clearCart: (state) => {
      state.items = [];
      state.userId = null;
    },

    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item._id === action.payload._id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
      if (state.userId) {
        localStorage.setItem(`cart_${state.userId}`, JSON.stringify(state.items));
      }
    },

    incrementQuantity: (state, action) => {
      const item = state.items.find(item => item._id === action.payload);
      if (item) item.quantity += 1;
      if (state.userId) {
        localStorage.setItem(`cart_${state.userId}`, JSON.stringify(state.items));
      }
    },

    decrementQuantity: (state, action) => {
      const item = state.items.find(item => item._id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        if (state.userId) {
          localStorage.setItem(`cart_${state.userId}`, JSON.stringify(state.items));
        }
      }
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item._id !== action.payload);
      if (state.userId) {
        localStorage.setItem(`cart_${state.userId}`, JSON.stringify(state.items));
      }
    },
  },
});
const syncCartToBackend = (items) => {
  axiosWithToken()
    .post('/cart/update', { items })
    .catch((err) => console.error("❌ Cart sync failed:", err));
};

export const {
  setUserId,
  setCartItems,
  clearCart,
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} = cartSlice.actions;

export default cartSlice.reducer;