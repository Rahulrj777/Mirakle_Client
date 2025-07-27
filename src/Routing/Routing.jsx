import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { useEffect } from "react"
import Mirakle_Home_page from "../pages/Mirakle_Home_page"
import ShopingPage from "../pages/ShopingPage"
import AboutUs from "../pages/AboutUs"
import Footer from "../components/Footer"
import AddToCart from "../pages/AddToCart"
import ProductDetail from "../pages/ProductDetail"
import LoginSignUp from "../pages/LoginSignUp"
import ResetPassword from "../pages/ResetPassword"
import ScrollToTop from "../pages/ScrollToTop"
import Checkout from "../pages/Checkout"
import Address from "../pages/Address"
import Header from "../components/Header"
import ContactUs from "../pages/ContactUs"

const AppRoutes = () => {
  const location = useLocation()

  // You can also add scroll to top here if needed
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const hideHeaderOnPaths = ["/"] // list of paths where you don't want the header

  return (
    <>
      {!hideHeaderOnPaths.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/" element={<Mirakle_Home_page />} />
        <Route path="/shop/allproduct" element={<ShopingPage filterType="all" />} />
        <Route path="/shop/offerproduct" element={<ShopingPage filterType="offer" />} />
        <Route path="/About_Us" element={<AboutUs />} />
        <Route path="/Contect_Us" element={<ContactUs />} />
        <Route path="/login_signup" element={<LoginSignUp />} />
        <Route path="/AddToCart" element={<AddToCart />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/Address" element={<Address />} />
      </Routes>
      <Footer />
    </>
  )
}

const Routing = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AppRoutes />
  </BrowserRouter>
)

export default Routing
