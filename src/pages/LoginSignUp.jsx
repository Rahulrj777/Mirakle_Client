import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Style/login.css";
import { API_BASE } from '../utils/api';
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { useDispatch } from "react-redux";
import { setCartItem, setUserId } from "../Redux/cartSlice";
import { axiosWithToken } from "../utils/axiosWithToken";

const LoginSignUp = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"));
    const token = userData?.token;
    if (token) navigate("/");
  }, [navigate]);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/signup`, {
        name,
        email,
        password, 
      });
      alert("✅ Account created successfully!");
      setIsSignUp(false);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert("❌ " + (error.response?.data?.message || "Signup failed"));
    }
  };

  const handleSignIn = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/login`, { email, password });
      const user = res.data.user;
      const token = res.data.token;
      localStorage.setItem("mirakleUser", JSON.stringify({ user, token }));
      dispatch(setUserId(user._id));

      const savedCart = localStorage.getItem(`cart_${user._id}`);
      if (savedCart) {
        dispatch(setCartItem(JSON.parse(savedCart)));
      } else {
        const cartRes = await axiosWithToken().get('/cart');
        const serverCart = cartRes.data;
        dispatch(setCartItem(Array.isArray(serverCart) ? serverCart : []));
      }
      navigate("/");
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleForgotPassword = () => {
    const userEmail = prompt("Enter your registered email:");
    if (!userEmail) return;
    axios
      .post(`${API_BASE}/api/forgot-password`, { email: userEmail })
      .then(() => alert("📩 Reset email sent!"))
      .catch((err) =>
        alert("❌ " + (err.response?.data?.message || "Error sending reset email"))
      );
  };

  return (
    <div className="login-container bg-green-100">
      <div className={`login-box min-h-[400px] ${isSignUp ? "signup-mode" : ""}`}>
        <div className="form-container sign-in-container">
          <div className="form-content">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Sign In</h2>
            <input
              type="email"
              placeholder="Email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                type={showSignInPassword ? "text" : "password"}
                placeholder="Password"
                className="form-input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="absolute right-3 top-6 cursor-pointer text-gray-500 text-xl"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
              >
                {showSignInPassword ? <IoIosEye /> : <IoIosEyeOff />}
              </span>
            </div>
            <p
              className="text-sm text-blue-500 mb-4 cursor-pointer"
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </p>
            <button className="form-button" onClick={handleSignIn}>
              SIGN IN
            </button>
          </div>
        </div>

        <div className="form-container sign-up-container">
          <div className="form-content">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Create Account</h2>
            <input
              type="text"
              placeholder="Name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                type={showSignUpPassword ? "text" : "password"}
                placeholder="Password"
                className="form-input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="absolute right-3 top-6 cursor-pointer text-gray-500 text-xl"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
              >
                {showSignUpPassword ? <IoIosEye /> : <IoIosEyeOff />}
              </span>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="form-input pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                className="absolute right-3 top-6 cursor-pointer text-gray-500 text-xl"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <IoIosEye /> : <IoIosEyeOff />}
              </span>
            </div>
            <button className="form-button" onClick={handleSignUp}>
              SIGN UP
            </button>
          </div>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h2 className="text-2xl font-bold">Welcome Back!</h2>
              <p className="text-sm my-4">
                Already have an account? Sign in to stay connected.
              </p>
              <button className="ghost-button" onClick={() => setIsSignUp(false)}>
                SIGN IN
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h2 className="text-2xl font-bold">Hello, Friend!</h2>
              <p className="text-sm my-4">
                Enter your personal details and start your journey.
              </p>
              <button className="ghost-button" onClick={() => setIsSignUp(true)}>
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignUp;
