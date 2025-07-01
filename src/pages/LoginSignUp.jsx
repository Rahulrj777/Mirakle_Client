import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Style/login.css";
import { API_BASE } from '../utils/api';

const LoginSignUp = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      const res = await axios.post("https://mirakle-backend.onrender.com/api/signup", {
        name,
        email,
        password,
      });
      alert("✅ Account created successfully!");
      setIsSignUp(false); // go to sign in
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      alert("❌ " + error.response.data.message);
    }
  };

  const handleSignIn = async () => {
    try {
        const res = await axios.post(`${API_BASE}/api/login`, {
        email,
        password,
        });
        localStorage.setItem("token", res.data.token);
        alert("✅ Logged in successfully!");
        navigate("/"); // Redirect to home/dashboard
    } catch (error) {
        alert("❌ " + error.response?.data?.message || "Login failed");
    }
    };

  const handleForgotPassword = () => {
    const userEmail = prompt("Enter your registered email:");
    if (!userEmail) return;
    axios
        .post(`${API_BASE}/api/forgot-password`, { email: userEmail })
        .then(() => alert("📩 Reset email sent!"))
        .catch((err) =>
        alert("❌ " + err.response?.data?.message || "Error sending reset email")
        );
    };

  return (
    <div className="login-container bg-green-100">
      <div className={`login-box ${isSignUp ? "signup-mode" : ""}`}>
        {/* Sign In Form */}
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
            <input
              type="password"
              placeholder="Password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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

        {/* Sign Up Form */}
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
            <input
              type="password"
              placeholder="Password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="form-button" onClick={handleSignUp}>
              SIGN UP
            </button>
          </div>
        </div>

        {/* Overlay */}
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
