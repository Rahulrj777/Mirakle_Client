import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setCartItem, setUserId, setCartReady } from "./Redux/cartSlice"
import Routing from "./Routing/Routing"
import { axiosWithToken } from "./utils/axiosWithToken"

const App = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    async function initializeCart() {
      const userData = JSON.parse(localStorage.getItem("mirakleUser"))

      if (!userData?.user?._id || !userData?.token) {
        // No authenticated user — reset cart and ready state
        dispatch(setUserId(null))
        dispatch(setCartItem([]))
        dispatch(setCartReady(true))
        return
      }

      const userId = userData.user._id
      const token = userData.token

      dispatch(setUserId(userId))

      try {
        // Fetch latest cart from backend for logged-in user
        const res = await axiosWithToken(token).get("/cart")

        const items = Array.isArray(res.data?.items) ? res.data.items : []

        // Initialize Redux cart state with backend cart
        dispatch(setCartItem(items))

        // Cache the cart in localStorage for quick reloads/offline fallback
        localStorage.setItem(`cart_${userId}`, JSON.stringify(items))
      } catch (error) {
        console.error("Failed to fetch cart from backend", error)

        // On error fallback to empty cart
        dispatch(setCartItem([]))
        localStorage.removeItem(`cart_${userId}`)
      } finally {
        dispatch(setCartReady(true))
      }
    }

    initializeCart()
  }, [dispatch])

  return <Routing />
}

export default App
