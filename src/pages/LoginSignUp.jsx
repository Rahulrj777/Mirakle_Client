import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../Style/login.css"
import { API_BASE } from "../utils/api"
import { IoIosEye, IoIosEyeOff } from "react-icons/io"
import { useDispatch } from "react-redux"
import { setCartItem, setUserId, clearCart, setCartReady } from "../Redux/cartSlice"
import { axiosWithToken } from "../utils/axiosWithToken"

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
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("mirakleUser"))
    const token = userData?.token
    if (token) navigate("/")
  }, [navigate])

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!")
      return
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("❌ Please fill all fields!")
      return
    }

    try {
      setLoading(true)
      const res = await axios.post(`${API_BASE}/api/signup`, {
        name: name.trim(),
        email: email.trim(),
        password,
      })
      alert("✅ Account created successfully!")
      setIsSignUp(false)
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Signup error:", error)
      alert("❌ " + (error.response?.data?.message || "Signup failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      alert("❌ Please fill all fields!")
      return
    }

    try {
      setLoading(true)
      const res = await axios.post(`${API_BASE}/api/login`, {
        email: email.trim(),
        password,
      })

      const user = res.data.user
      const token = res.data.token

      localStorage.setItem("mirakleUser", JSON.stringify({ user, token }))
      dispatch(setUserId(user._id))
      dispatch(clearCart())

      const savedCart = localStorage.getItem(`cart_${user._id}`)
      if (savedCart) {
        // Local cart exists → load to Redux first
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          dispatch(setCartItem(parsedCart))
          // Then sync it to backend
          try {
            await axiosWithToken().post("/cart", { items: parsedCart })
          } catch (syncError) {
            console.error("Cart sync error:", syncError)
          }
        }
      } else {
        // No local cart → fetch from backend
        try {
          const cartRes = await axiosWithToken().get("/cart")
          const serverCart = Array.isArray(cartRes.data) ? cartRes.data : []
          dispatch(setCartItem(serverCart))
          // Store server cart into localStorage
          localStorage.setItem(`cart_${user._id}`, JSON.stringify(serverCart))
        } catch (fetchError) {
          console.error("Fetch cart error:", fetchError)
          dispatch(setCartItem([]))
        }
      }

      dispatch(setCartReady(true))
      navigate("/")
    } catch (error) {
      console.error("Login error:", error)
      alert("❌ " + (error.response?.data?.message || "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      alert("❌ Please enter your email address!")
      return
    }

    try {
      setForgotLoading(true)
      await axios.post(`${API_BASE}/api/forgot-password`, {
        email: forgotEmail.trim(),
      })
      alert("📩 Reset email sent successfully!")
      setShowForgotPassword(false)
      setForgotEmail("")
    } catch (error) {
      console.error("Forgot password error:", error)
      alert("❌ " + (error.response?.data?.message || "Error sending reset email"))
    } finally {
      setForgotLoading(false)
    }
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
            <p
              className="text-sm text-blue-500 mb-4 cursor-pointer hover:underline"
              onClick={() => setShowForgotPassword(true)}
            >
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
            <button className="form-button" onClick={handleSignUp} disabled={loading}>
              {loading ? "CREATING..." : "SIGN UP"}
            </button>
          </div>
        </div>

        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Reset Password</h3>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {forgotLoading ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotEmail("")
                  }}
                  disabled={forgotLoading}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
