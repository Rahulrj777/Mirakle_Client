import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import logo from "../assets/logo.png";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../Redux/cartSlice";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

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

  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full bg-white shadow">
      {/* 🌐 Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-10 py-5 h-[80px]">
        {/* Logo */}
        <Link to="/">
          <img src={logo} alt="logo" className="w-[150px] object-contain" />
        </Link>

        {/* Navigation */}
        <nav>
          <ul className="flex gap-6 font-semibold text-lg">
            {[
              { path: "/", label: "Home" },
              { path: "/shop/allproduct", label: "Shop" },
              { path: "/About_Us", label: "About Us" },
              { path: "/Contact_Us", label: "Contact Us" },
            ].map((item) => (
              <li key={item.path} className="cursor-pointer flex flex-col items-center">
                <Link
                  to={item.path}
                  className={`${
                    isActive(item.path) ? "font-bold text-green-700" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
                {isActive(item.path) && (
                  <div className="mt-1 w-3/4 h-[3px] bg-green-700 rounded-full" />
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-5 text-[24px] relative">
          {/* User */}
          {user ? (
            <span
              onClick={() => navigate("/profile")}
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-700 text-white"
            >
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span onClick={() => navigate("/login_signup")} className="cursor-pointer hover:text-green-600">
              <FaRegUser />
            </span>
          )}

          {/* Cart */}
          <span className="relative cursor-pointer" onClick={handleCartClick}>
            <HiOutlineShoppingBag className="text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 📱 Mobile Header */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 h-[60px]">
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
          <span
            onClick={() => (user ? navigate("/profile") : navigate("/login_signup"))}
            className="text-2xl text-gray-700 cursor-pointer"
          >
            <FaRegUser />
          </span>

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

      {/* Side Drawer for Mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50" onClick={() => setIsOpen(false)}>
          <div
            className={`fixed top-0 left-0 w-3/4 h-full bg-white shadow-lg p-5 flex flex-col transform transition-transform duration-300 ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
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

export default Header;
