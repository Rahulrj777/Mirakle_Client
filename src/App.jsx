import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Routing from '../src/Routing/Routing';
import { API_BASE } from './utils/api';

const App = () => {
  const cart = useSelector((state) => state.cart); // Get cart state from Redux

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const syncCart = async () => {
      try {
        await axios.post(`${API_BASE}/api/cart`, { items: cart }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Cart sync failed:', err);
      }
    };

    syncCart();
  }, [cart]); // Sync whenever cart changes

  return <Routing />;
};

export default App;
