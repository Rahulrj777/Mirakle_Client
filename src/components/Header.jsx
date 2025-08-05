import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import logo from "../assets/logo.png";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../Redux/cartSlice";

const MobileHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items) || [];
  const cartCount = cartItems.length;

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))?.user || null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("mirakleUser");
    dispatch(clearUser());
    setUser(null);
    setIsOpen(false);
    navigate("/login_signup");
  };

  const handleCartClick = () => {
    if (!user) {
      alert("Please login to view your cart");
      navigate("/login_signup");
    } else {
      navigate("/AddToCart");
    }
  };

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white md:hidden shadow">
      {/* Top Row */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger */}
        <button onClick={() => setIsOpen(true)} className="text-2xl text-gray-700">
          <FiMenu />
        </button>

        {/* Logo */}
        <Link to="/">
          <img src={logo} alt="logo" className="w-[120px] object-contain" />
        </Link>

        {/* Icons */}
        <div className="flex items-center gap-4">
          {/* User */}
          <span
            onClick={() => (user ? navigate("/profile") : navigate("/login_signup"))}
            className="text-2xl text-gray-700 cursor-pointer"
          >
            <FaRegUser />
          </span>

          {/* Cart */}
          <span className="relative text-2xl text-gray-700 cursor-pointer" onClick={handleCartClick}>
            <HiOutlineShoppingBag />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Search for Products, Brands and More"
          className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {/* Side Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50" onClick={() => setIsOpen(false)}>
          <div
            className="fixed top-0 left-0 w-3/4 h-full bg-white shadow-lg p-5 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-700">Menu</h2>
              <button onClick={() => setIsOpen(false)} className="text-2xl text-gray-700">
                <FiX />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-4 flex-1">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-gray-700 text-lg">Home</Link>
              <Link to="/shop/allproduct" onClick={() => setIsOpen(false)} className="text-gray-700 text-lg">Shop</Link>
              <Link to="/About_Us" onClick={() => setIsOpen(false)} className="text-gray-700 text-lg">About Us</Link>
              <Link to="/Contact_Us" onClick={() => setIsOpen(false)} className="text-gray-700 text-lg">Contact Us</Link>
            </nav>

            {/* Auth Button */}
            {user ? (
              <button
                onClick={handleLogout}
                className="mt-auto py-2 w-full bg-red-500 text-white rounded-md text-center"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/login_signup")}
                className="mt-auto py-2 w-full bg-green-500 text-white rounded-md text-center"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
