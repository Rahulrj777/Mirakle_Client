import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Routing from './Routing/Routing';

const App = () => {
  const cart = useSelector((state) => state.cart.items) || []
  const userId = useSelector((state) => state.cart.userId);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    }
  }, [cart, userId]);

  return <Routing />;
};

export default App;
