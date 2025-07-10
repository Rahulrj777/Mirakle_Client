import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserId, setcartItem } from './Redux/cartSlice';
import { axiosWithToken } from './utils/axiosWithToken';     
import Routing from './Routing/Routing';

const App = () => {
  const dispatch = useDispatch();
  const [isCartLoaded, setIsCartLoaded] = useState(false);


  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"));
    if (userData?.token) {
      dispatch(clearCart()); // ← prevent old cart
      axiosWithToken()
        .get("/cart")
        .then((res) => {
          dispatch(setcartItem(res.data));
          setIsCartLoaded(true);
        })
        .catch((err) => {
          console.error("❌ Failed to load backend cart:", err);
          setIsCartLoaded(true); // still mark as loaded
        });
    } else {
      setIsCartLoaded(true); // no user, still mark as loaded
    }
  }, [dispatch]);

  return <Routing />;
};

export default App;
