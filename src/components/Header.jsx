import logo from "../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useCallback, useRef } from "react";
import { clearUser } from "../Redux/cartSlice";
import axios from "axios";
import { API_BASE } from "../utils/api";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items) || [];
  const cartCount = cartItems.length;

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mirakleUser"))?.user || null;
    } catch {
      return null;
    }
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const searchBoxRef = useRef(null);
  const dropdownRef = useRef(null);

  // Check if route is active
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  // Handle search suggestions click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search input
  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`);
      setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/shop/allproduct?search=${encodeURIComponent(searchTerm.trim())}`);
      setSuggestions([]);
      setSearchTerm("");
    }
  };

  const handleSelectSuggestion = (id) => {
    navigate(`/product/${id}`);
    setSuggestions([]);
    setSearchTerm("");
  };

  // Handle user dropdown click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = () => {
    if (user) {
      setShowDropdown((prev) => !prev);
    } else {
      navigate("/login_signup");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mirakleUser");
    dispatch(clearUser());
    setUser(null);
    setShowDropdown(false);
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
    <header className="w-full px-10 py-5 flex items-center justify-between bg-transparent text-white h-[80px] top-0 left-0 z-50">
      {/* Logo */}
      <Link to="/">
        <img src={logo} alt="logo" className="w-[150px] object-contain" />
      </Link>

      {/* Navigation Links */}
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
                className={`text-black transition-colors ${isActive(item.path) ? "underline" : ""}`}
              >
                {item.label}
              </Link>
              {isActive(item.path) && <hr className="mt-[4px] w-full h-[3px] bg-white rounded-[10px]" />}
            </li>
          ))}
        </ul>
      </nav>

      {/* Search & Icons */}
      <div className="flex items-center gap-5 text-[24px] relative">
        {/* Search Box */}
        <div className="relative" ref={searchBoxRef}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-[200px] px-3 py-1.5 text-sm text-black border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-50 bg-white text-black border mt-1 rounded shadow-md max-h-60 overflow-y-auto w-full text-sm">
              {suggestions.map((item) => (
                <li
                  key={item._id}
                  onClick={() => handleSelectSuggestion(item._id)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    {item.images?.others?.[0]?.url && (
                      <img
                        src={item.images.others[0].url}
                        alt={item.title}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span className="flex-1 truncate">{item.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User Icon */}
        {user ? (
          <div ref={dropdownRef} className="relative">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-700 cursor-pointer"
              onClick={handleUserClick}
            >
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            {showDropdown && (
              <div className="absolute top-12 right-0 bg-white text-black shadow-lg rounded-md z-50 w-48 py-2 border">
                <div className="px-4 py-2 border-b">
                  <p className="text-gray-700 text-sm font-medium">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">ID: {user._id?.slice(-6)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <span onClick={handleUserClick} className="cursor-pointer hover:text-green-600 transition-colors">
            <FaRegUser />
          </span>
        )}

        {/* Cart Icon */}
        <span className="relative cursor-pointer" onClick={handleCartClick}>
          <HiOutlineShoppingBag className="text-black transition-colors" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </span>
      </div>
    </header>
  );
};

export default Header;
