import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../Style/login.css"
import { API_BASE } from "../utils/api"
import { IoIosEye, IoIosEyeOff } from "react-icons/io"
import { useDispatch } from "react-redux"
import { setCartItem, setUserId, setCartReady, clearUser } from "../Redux/cartSlice"
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
      await axios.post(`${API_BASE}/api/users/signup`, {
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

      // 🔥 STEP 1: Clear everything first
      console.log("🔄 Clearing previous session...")
      dispatch(clearUser())
      dispatch(setCartReady(false))

      // Small delay to ensure Redux state is cleared
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 🔥 STEP 2: Login
      console.log("🔐 Attempting login...")
      const res = await axios.post(`${API_BASE}/api/users/login`, {
        email: email.trim(),
        password,
      })

      const user = res.data.user
      const token = res.data.token

      console.log("✅ Login successful for user:", user._id)

      // 🔥 STEP 3: Store user data
      localStorage.setItem("mirakleUser", JSON.stringify({ user, token }))
      dispatch(setUserId(user._id))

      // 🔥 STEP 4: Handle cart loading with better error handling
      try {
        console.log("📦 Loading cart for user:", user._id)

        // Check localStorage first
        const savedCart = localStorage.getItem(`cart_${user._id}`)
        let cartToLoad = []

        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart)
            if (Array.isArray(parsedCart) && parsedCart.length > 0) {
              console.log("📦 Found local cart with", parsedCart.length, "items")
              cartToLoad = parsedCart

              // Sync local cart to server
              try {
                await axiosWithToken().post("/cart", { items: parsedCart })
                console.log("✅ Local cart synced to server")
              } catch (syncError) {
                console.warn("⚠️ Failed to sync local cart to server:", syncError.message)
              }
            }
          } catch{
            console.warn("⚠️ Failed to parse local cart, will fetch from server")
          }
        }

        // If no local cart or local cart is empty, fetch from server
        if (cartToLoad.length === 0) {
          try {
            console.log("📦 Fetching cart from server...")
            const cartRes = await axiosWithToken().get("/cart")
            const serverCart = cartRes.data?.items || cartRes.data || []

            if (Array.isArray(serverCart) && serverCart.length > 0) {
              console.log("📦 Found server cart with", serverCart.length, "items")
              cartToLoad = serverCart
              // Save server cart to localStorage
              localStorage.setItem(`cart_${user._id}`, JSON.stringify(serverCart))
            }
          } catch (fetchError) {
            console.warn("⚠️ Failed to fetch cart from server:", fetchError.message)
            // Don't throw error, just use empty cart
          }
        }

        // Set cart in Redux
        dispatch(setCartItem(cartToLoad))
        console.log("✅ Cart loaded with", cartToLoad.length, "items")
      } catch (cartError) {
        console.error("❌ Cart loading failed:", cartError)
        // Set empty cart on any cart-related error
        dispatch(setCartItem([]))
      }

      // 🔥 STEP 5: Mark cart as ready and navigate
      dispatch(setCartReady(true))
      console.log("✅ Login process completed")
      navigate("/")
    } catch (error) {
      console.error("❌ Login error:", error)
      alert("❌ " + (error.response?.data?.message || "Login failed"))
      // Clear any partial state on login failure
      dispatch(clearUser())
    } finally {
      setLoading(false)
    }
  }

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
