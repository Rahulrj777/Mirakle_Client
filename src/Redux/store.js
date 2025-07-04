// Redux/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { thunk } from 'redux-thunk'; // ✅ Correct for ESM

const persistConfig = {
  key: 'root', // not just 'cart'
  storage,
  whitelist: ['cart'], // only cart will be persisted
};

const rootReducer = combineReducers({
  cart: cartReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(thunk),
});

store.subscribe(() => {
  console.log('Cart state:', store.getState().cart);
});

export const persistor = persistStore(store);
