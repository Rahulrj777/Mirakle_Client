import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserId } from './Redux/cartSlice';
import Routing from './Routing/Routing';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"));
    if (userData?.user?._id) {
      dispatch(setUserId(userData.user._id));
    }
  }, [dispatch]);

  return <Routing />;
};

export default App;
