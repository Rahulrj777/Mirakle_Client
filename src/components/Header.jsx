import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { useSelector,useDispatch  } from "react-redux";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from "../assets/logo.png";
import { API_BASE } from "../utils/api";
import { clearCart } from "../Redux/cartSlice";
import { persistStore } from 'redux-persist';
import { store } from '../redux/store';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const persistor = persistStore(store);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mirakleUser");
    try {
      return stored ? JSON.parse(stored)?.user || null : null;
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
  const stored = localStorage.getItem("mirakleUser");
  try {
    setUser(stored ? JSON.parse(stored)?.user || null : null);
  } catch {
    setUser(null);
  }
}, [location.pathname]);


  useEffect(() => {
    if (!searchTerm.trim()) setSuggestions([]);
  }, [searchTerm]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) return setSuggestions([]);

    try {
      const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`);
      setSuggestions(res.data.slice(0, 6));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/shop/allproduct?search=${encodeURIComponent(searchTerm.trim())}`);
      setSuggestions([]);
      setSearchTerm("");
    }
  };

const handleLogout = () => {
  localStorage.removeItem("mirakleUser");
  dispatch(clearCart()); // ✅ clear Redux + localStorage cart
  navigate("/login_signup");
}

  const handleSelectSuggestion = (id) => {
    navigate(`/product/${id}`);
    setSearchTerm("");
    setSuggestions([]);
  };

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
    <header className="sticky top-0 z-[150] shadow-md bg-white">
      <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src={logo || "/placeholder.svg"} alt="logo" className="w-25 h-10 object-contain" />
        </Link>

        {/* Search */}
        <div className="relative w-full max-w-full mx-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Search the product..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {searchTerm.trim() !== "" && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-white border mt-1 rounded shadow max-h-80 overflow-y-auto">
              {suggestions.map((item) => (
                <li
                  key={item._id}
                  onClick={() => handleSelectSuggestion(item._id)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {item.images?.others?.[0] && (
                      <img
                        src={`${API_BASE}${item.images.others[0]}`}
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-5 text-[24px] relative">
          {user ? (
            <div ref={dropdownRef} className="relative">
              <div
                className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full cursor-pointer text-lg font-semibold"
                onClick={() => setShowDropdown(!showDropdown)}
              >
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
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
            <span onClick={() => navigate("/login_signup")} className="cursor-pointer">
              <FaRegUser className="text-black" />
            </span>
          )}

          {/* Cart icon */}
            <span
              className="relative cursor-pointer"
              onClick={() => {
                if (!user) {
                  alert("Please login to view your cart");
                  navigate("/login_signup");
                } else {
                  navigate("/AddToCart");
                }
              }}
            >
            <HiOutlineShoppingBag className="text-black" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartItems.length}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="bg-[rgb(119,221,119)]">
        <ul className="max-w-7xl mx-auto px-4 py-2 flex justify-center gap-6 font-semibold text-white text-lg">
          {[
            { path: "/", list: "Home" },
            { path: "/shop/allproduct", list: "Shop" },
            { path: "/About_Us", list: "About Us" },
            { path: "/Contect_Us", list: "Contact Us" },
          ].map((item) => (
            <li key={item.path} className="cursor-pointer flex flex-col items-center">
              <Link to={item.path} className={isActive(item.path) ? "text-white font-bold" : "text-white"}>
                {item.list}
              </Link>
              {isActive(item.path) && <hr className="mt-[4px] w-full h-[3px] bg-white rounded-[10px] border-none" />}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
