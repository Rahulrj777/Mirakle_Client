import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Routing from '../src/Routing/Routing';
import { API_BASE } from './utils/api';

const App = () => {
  const cart = useSelector((state) => state.cart); 

useEffect(() => {
  const userData = JSON.parse(localStorage.getItem("mirakleUser"));
  const token = userData?.token;
  if (!token) return;

  const syncCart = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/cart`, { items: cart }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Cart sync success:", res.data);
    } catch (err) {
      console.error("Cart sync failed:", err);
    }
  };

  syncCart();
}, [cart]);


  return <Routing />;
};

export default App;
