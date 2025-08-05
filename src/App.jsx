import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { 
  setCartItem, 
  setUserId, 
  setCartReady, 
  clearUser, 
  initializeSelectedAddress 
} from "./Redux/cartSlice"
import Routing from "./Routing/Routing"
import { axiosWithToken } from "./utils/axiosWithToken"

const App = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    async function initializeCart() {
      try {
        const userData = JSON.parse(localStorage.getItem("mirakleUser"))

        if (!userData?.user?._id || !userData?.token) {
          console.log("🔄 No authenticated user, clearing cart state")
          dispatch(clearUser())
          return
        }

        const userId = userData.user._id
        const token = userData.token

        console.log("🔄 Initializing cart for user:", userId)

        const savedAddress = localStorage.getItem("deliveryAddress")
        if (savedAddress) {
          dispatch(initializeSelectedAddress(JSON.parse(savedAddress)))
        }

        dispatch(setUserId(userId))

        dispatch(setCartItem([]))
        dispatch(setCartReady(false))

        try {
          const res = await axiosWithToken(token).get("/cart")
          const items = Array.isArray(res.data?.items) ? res.data.items : []

          console.log("✅ Fetched cart from backend:", items.length, "items")
          dispatch(setCartItem(items))

          localStorage.setItem(`cart_${userId}`, JSON.stringify(items))
        } catch (error) {
          console.error("❌ Failed to fetch cart from backend", error)

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
        dispatch(setCartReady(true))
      }
    }

    initializeCart()
  }, [dispatch])

  return <Routing />
}

export default App
