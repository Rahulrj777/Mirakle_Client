// store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer from '../Redux/cartSlice';
import userReducer from '../Redux/userSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { thunk } from 'redux-thunk';

let userId = "guest";
if (typeof window !== "undefined") {
  try {
    const localUser = JSON.parse(localStorage.getItem("mirakleUser"));
    userId = localUser?.user?._id || "guest";
  } catch (error) {
    console.warn("❌ Failed to parse mirakleUser", error);
    userId = "guest";
  }
}

const persistConfig = {
  key: `cart_${userId}`, // ✅ Dynamic per user
  storage,
  whitelist: ['items', 'userId', 'cartReady'],
};

const persistedCartReducer = persistReducer(persistConfig, cartReducer);

const rootReducer = combineReducers({
  cart: persistedCartReducer,
  user: userReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

export const persistor = persistStore(store);
