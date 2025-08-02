import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../Style/login.css"
import { API_BASE } from "../utils/api"
import { IoIosEye, IoIosEyeOff } from "react-icons/io"
import { useDispatch } from "react-redux"
import { setCartItem, setUserId, setCartReady, clearUser } from "../Redux/cartSlice"
// import { axiosWithToken } from "../utils/axiosWithToken"

const LoginSignUp = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"))
    const token = userData?.token
    if (token) navigate("/")
  }, [navigate])

  const handleSignUp = async () => {
    if (!otpSent) {
      alert("Please request and verify OTP first!");
      return;
    }
    if (!otp) {
      alert("Enter OTP to verify!");
      return;
    }

    try {
      setLoading(true);
      // Verify OTP first
      const res = await axios.post(`${API_BASE}/api/users/verify-otp`, { email, otp });
      const { user, token } = res.data;

      // Save user locally
      localStorage.setItem("mirakleUser", JSON.stringify({ user, token }));
      alert("✅ Account created & verified!");
      navigate("/");
    } catch (err) {
      alert("❌ Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      alert("❌ Please fill all fields!");
      return;
    }

    setLoading(true);
    try {
      // Clear previous user/cart state
      dispatch(clearUser());
      dispatch(setCartReady(false));
      await new Promise(r => setTimeout(r, 100)); // Wait for Redux to settle

      // Login request
      const res = await axios.post(`${API_BASE}/api/users/login`, {
        email: email.trim(),
        password,
      });
      const user = res.data.user;
      const token = res.data.token;

      localStorage.setItem("mirakleUser", JSON.stringify({ user, token }));
      dispatch(setUserId(user._id));

      // Attempt local cart sync to backend
      const savedCart = localStorage.getItem(`cart_${user._id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            await axios.post(`${API_BASE}/api/cart`, { items: parsedCart }, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch {
          // ignore parse failures
        }
      }

      // Then fetch authoritative cart from backend
      try {
        const cartRes = await axios.get(`${API_BASE}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const serverCart = Array.isArray(cartRes.data?.items) ? cartRes.data.items : [];
        dispatch(setCartItem(serverCart));
        localStorage.setItem(`cart_${user._id}`, JSON.stringify(serverCart));
      } catch {
        dispatch(setCartItem([]));
        localStorage.setItem(`cart_${user._id}`, "[]");
      }

      dispatch(setCartReady(true));
      navigate("/");
    } catch (error) {
      alert("❌ " + (error.response?.data?.message || "Login failed."));
      dispatch(clearUser());
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
  if (!email.trim()) return alert("Enter your email");
  try {
    await axios.post(`${API_BASE}/api/users/send-otp`, { email });
    alert("✅ OTP sent to your email");
    setOtpSent(true);
  } catch (err) {
    alert("❌ Failed to send OTP");
  }
};

const verifyOtp = async () => {
  try {
    const res = await axios.post(`${API_BASE}/api/users/verify-otp`, { email, otp });
    const { user, token } = res.data;
    localStorage.setItem("mirakleUser", JSON.stringify({ user, token }));
    navigate("/");
  } catch (err) {
    alert("❌ Invalid OTP");
  }
};

  const handleForgotPassword = () => {
    const userEmail = prompt("Enter your registered email:")
    if (!userEmail || !userEmail.trim()) return

    axios
      .post(`${API_BASE}/api/admin/forgot-password`, { email: userEmail.trim() })
      .then(() => alert("📩 Reset email sent!"))
      .catch((err) => alert("❌ " + (err.response?.data?.message || "Error sending reset email")))
  }

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
              disabled={loading}
            />
            <div className="relative">
              <input
                type={showSignInPassword ? "text" : "password"}
                placeholder="Password"
                className="form-input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <span
                className="absolute right-3 top-6 cursor-pointer text-gray-500 text-xl"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
              >
                {showSignInPassword ? <IoIosEye /> : <IoIosEyeOff />}
              </span>
            </div>
            <p className="text-sm text-blue-500 mb-4 cursor-pointer hover:underline" onClick={handleForgotPassword}>
              Forgot your password?
            </p>
            <button className="form-button" onClick={handleSignIn} disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
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
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <div className="relative">
              <input
                type={showSignUpPassword ? "text" : "password"}
                placeholder="Password"
                className="form-input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
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
                disabled={loading}
              />
              <span
                className="absolute right-3 top-6 cursor-pointer text-gray-500 text-xl"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <IoIosEye /> : <IoIosEyeOff />}
              </span>
            </div>
            {otpSent ? (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button className="form-button" onClick={verifyOtp}>
                  Verify OTP
                </button>
              </>
            ) : (
              <button className="form-button" onClick={sendOtp}>
                Send OTP
              </button>
            )}
            <button className="form-button" onClick={handleSignUp} disabled={loading}>
              {loading ? "CREATING..." : "SIGN UP"}
            </button>
          </div>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h2 className="text-2xl font-bold">Welcome Back!</h2>
              <p className="text-sm my-4">Already have an account? Sign in to stay connected.</p>
              <button className="ghost-button" onClick={() => setIsSignUp(false)}>
                SIGN IN
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h2 className="text-2xl font-bold">Hello, Friend!</h2>
              <p className="text-sm my-4">Enter your personal details and start your journey.</p>
              <button className="ghost-button" onClick={() => setIsSignUp(true)}>
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSignUp
