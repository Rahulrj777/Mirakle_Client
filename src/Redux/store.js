// store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../Redux/cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { thunk } from 'redux-thunk';

let userId = "guest";
if (typeof window !== "undefined") {
  const localUser = JSON.parse(localStorage.getItem("mirakleUser"));
  userId = localUser?.userId || "guest";
}

const persistConfig = {
  key: `cart_${userId}`,
  storage,
  whitelist: ["items"],
};

const persistedCartReducer = persistReducer(persistConfig, cartReducer);

export const store = configureStore({
  reducer: {
    cart: persistedCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

store.subscribe(() => {
  const state = store.getState();
  console.log("Cart Items:", state.cart.items);
});

export const persistor = persistStore(store);
