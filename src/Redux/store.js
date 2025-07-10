// store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../Redux/cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

let userId = "guest";
if (typeof window !== "undefined") {
  const localUser = JSON.parse(localStorage.getItem("mirakleUser"));
  userId = localUser?.user?._id || "guest";
}

const persistConfig = {
  key: `cart_${userId}`,
  storage,
  whitelist: ['items', 'userId'],
};

const persistedCartReducer = persistReducer(persistConfig, cartReducer);

export const store = configureStore({
  reducer: {
    cart: persistedCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
