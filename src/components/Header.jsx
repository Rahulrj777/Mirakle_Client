import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { useSelector } from 'react-redux';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef } from 'react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useSelector(state => state.cart);

  const isActive = (path) => location.pathname === path;

  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("mirakleUser");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mirakleUser");
    setUser(null);
    setShowDropdown(false);
    navigate("/");
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-150 shadow-md">
      <div className="bg-white px-4 py-3 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src={logo} alt="logo" className="w-25 h-15 object-contain" />
        </Link>

        {/* Search bar */}
        <div className="hidden md:flex flex-1 mx-6">
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-5 text-[24px] relative">
          {user ? (
            <div ref={dropdownRef} className="relative">
              <div
                className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full cursor-pointer text-lg font-semibold"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              {showDropdown && (
                <div className="absolute top-12 right-0 bg-white shadow-md rounded-md z-50 w-40 py-2">
                  <p className="px-4 py-2 text-gray-700 text-sm">{user.name || user.email}</p>
                  <hr />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login_signup">
              <FaRegUser className="text-black" />
            </Link>
          )}

          {/* Cart icon */}
          <Link to="/AddToCart" className="relative">
            <HiOutlineShoppingBag className="text-black" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartItems.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Nav Bar */}
      <nav className="bg-green-600">
        <ul className="max-w-7xl mx-auto px-4 py-2 flex justify-center gap-6 font-semibold text-white text-lg">
          {[
            { path: '/', list: 'Home' },
            { path: '/shop/allproduct', list: 'Shop' },
            { path: '/About_Us', list: 'About Us' },
            { path: '/Contect_Us', list: 'Contact Us' },
          ].map((item) => (
            <li key={item.path} className="cursor-pointer flex flex-col items-center">
              <Link
                to={item.path}
                className={isActive(item.path) ? 'text-white font-bold' : 'text-white'}
              >
                {item.list}
              </Link>
              {isActive(item.path) && (
                <hr className="mt-[4px] w-full h-[3px] bg-white rounded-[10px] border-none" />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
