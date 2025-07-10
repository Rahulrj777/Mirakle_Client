// store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer from '../Redux/cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { thunk } from 'redux-thunk';

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

const rootReducer = combineReducers({
  cart: persistedCartReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

export const persistor = persistStore(store);
