// Redux/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { thunk } from 'redux-thunk'; // ✅ Correct for ESM

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const syncCart = async () => {
    try {
      await axios.post(`${API_BASE}/api/cart`, { items: cart }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Auto cart sync failed:", err);
    }
  };

  syncCart();
}, [cart]);

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
