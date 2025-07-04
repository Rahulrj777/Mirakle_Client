// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';
import thunk from 'redux-thunk';

// Configuration
const persistConfig = {
  key: 'root',
  storage,
};

// Combine reducers (useful if you add more in future)
const rootReducer = combineReducers({
  cart: cartReducer,
});

// Wrap with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: [thunk],
});

// Persistor for React setup
export const persistor = persistStore(store);
