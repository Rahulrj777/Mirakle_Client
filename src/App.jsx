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
      dispatch(setUserId(userData.user._id));
      axiosWithToken()
        .get("/cart")
        .then((res) => {
          dispatch(setCartItem(res.data));
          dispatch(setCartReady(true));
          localStorage.setItem(`cart_${userData.user._id}`, JSON.stringify(res.data));
        })
        .catch((err) => {
          console.error("❌ Failed to load backend cart:", err);
          dispatch(setCartReady(true));
        });
    } else {
      dispatch(setCartReady(true));
    }
  }, []);

  return <Routing />;
};

export default App;
