import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCartItems, setUserId } from './Redux/cartSlice';
import Routing from './Routing/Routing';

const App = () => {
  const cart = useSelector((state) => state.cart.items) || [];
  const userId = useSelector((state) => state.cart.userId);
  const dispatch = useDispatch();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"));
    if (userData?.user?._id) {
      dispatch(setUserId(userData.user._id));
      const savedCart = localStorage.getItem(`cart_${userData.user._id}`);
      if (savedCart) {
        dispatch(setCartItems(JSON.parse(savedCart)));
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (userId && Array.isArray(cart)) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    }
  }, [cart, userId]);

  return (
      <Routing />

  );
};

export default App;