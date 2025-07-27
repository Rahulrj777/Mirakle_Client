"use client"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setCartItem, setUserId, setCartReady, clearUser } from "./Redux/cartSlice"
import Routing from "./Routing/Routing"
import { axiosWithToken } from "./utils/axiosWithToken"

const App = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    async function initializeCart() {
      try {
        const userData = JSON.parse(localStorage.getItem("mirakleUser"))

        if (!userData?.user?._id || !userData?.token) {
          // No authenticated user — clear everything
          console.log("🔄 No authenticated user, clearing cart state")
          dispatch(clearUser())
          return
        }

        const userId = userData.user._id
        const token = userData.token

        console.log("🔄 Initializing cart for user:", userId)

        // Set user ID first
        dispatch(setUserId(userId))

        // Clear cart state before loading
        dispatch(setCartItem([]))
        dispatch(setCartReady(false))

        try {
          // Fetch latest cart from backend for logged-in user
          const res = await axiosWithToken(token).get("/cart")
          const items = Array.isArray(res.data?.items) ? res.data.items : []

          console.log("✅ Fetched cart from backend:", items.length, "items")

          // Initialize Redux cart state with backend cart
          dispatch(setCartItem(items))

          // Cache the cart in localStorage for this specific user
          localStorage.setItem(`cart_${userId}`, JSON.stringify(items))
        } catch (error) {
          console.error("❌ Failed to fetch cart from backend", error)

          // On error, try to load from localStorage as fallback
          const cachedCart = localStorage.getItem(`cart_${userId}`)
          if (cachedCart) {
            try {
              const parsedCart = JSON.parse(cachedCart)
              if (Array.isArray(parsedCart)) {
                console.log("📦 Loading cart from localStorage fallback")
                dispatch(setCartItem(parsedCart))
              } else {
                dispatch(setCartItem([]))
              }
            } catch (parseError) {
              console.error("❌ Failed to parse cached cart", parseError)
              localStorage.removeItem(`cart_${userId}`)
              dispatch(setCartItem([]))
            }
          } else {
            dispatch(setCartItem([]))
          }
        }
      } catch (error) {
        console.error("❌ Error initializing cart:", error)
        dispatch(clearUser())
      } finally {
        // Always mark cart as ready after initialization attempt
        dispatch(setCartReady(true))
      }
    }

    initializeCart()
  }, [dispatch])

  return <Routing />
}

export default App
