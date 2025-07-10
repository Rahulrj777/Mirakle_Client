import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserId, setcartItem } from './Redux/cartSlice';
import { axiosWithToken } from './utils/axiosWithToken';     
import Routing from './Routing/Routing';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"));
    if (userData?.user?._id) {
      dispatch(setUserId(userData.user._id));

      axiosWithToken()
        .get("/cart")
        .then((res) => {
          dispatch(setcartItem(res.data));
        })
        .catch((err) => {
          console.error("❌ Failed to load backend cart:", err);
        });
    }
  }, [dispatch]);

  return <Routing />;
};

export default App;
