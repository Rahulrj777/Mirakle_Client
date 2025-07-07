import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Routing from '../src/Routing/Routing';
import { API_BASE } from './utils/api';

const App = () => {
  const cart = useSelector((state) => state.cart); 

useEffect(() => {
  const user = JSON.parse(localStorage.getItem("mirakleUser"));
  if (user?.user?._id) {
    localStorage.setItem(`cart_${user.user._id}`, JSON.stringify(cart));
  }
}, [cart]);


  return <Routing />;
};

export default App;
