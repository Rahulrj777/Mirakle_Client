import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Mirakle_Home_page from '../pages/Mirakle_Home_page';
import ShopingPage from '../pages/ShopingPage';
import AboutUs from '../pages/AboutUs';
import ContectUs from '../pages/ContectUs';
import Footer from '../components/Footer';
import Header from '../components/Header';
import AddToCart from '../pages/AddToCart';
import ProductDetail from '../pages/ProductDetail';
import LoginSignUp from '../pages/LoginSignUp';
import ResetPassword from '../pages/ResetPassword';

const Routing = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Mirakle_Home_page />} />

        {/* Shop Pages */}
        <Route path="/shop/allproduct" element={<ShopingPage filterType="all" />} />
        <Route path="/shop/offerproduct" element={<ShopingPage filterType="offer" />} />

        {/* Other Pages */}
        <Route path="/About_Us" element={<AboutUs />} />
        <Route path="/Contect_Us" element={<ContectUs />} />
        <Route path="/login_signup" element={<LoginSignUp />} />
        <Route path="/AddToCart" element={<AddToCart/>} />
        <Route path="/product/:id" element={<ProductDetail/>} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};

export default Routing;
