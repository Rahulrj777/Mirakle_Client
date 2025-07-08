// store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { thunk } from 'redux-thunk';

const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'userId'],
};

const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);

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
