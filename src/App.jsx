import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Routing from './Routing/Routing';

const App = () => {
  const cart = useSelector((state) => state.cart.items) || []

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem("mirakleUser"));
    if (localUser?.user?._id) {
      localStorage.setItem(`cart_${localUser.user._id}`, JSON.stringify(cart));
    }
  }, [cart]);

  return <Routing />;
};

export default App;
