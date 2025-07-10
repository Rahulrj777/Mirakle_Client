"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { setCartItem, setUserId, setCartReady } from "./Redux/cartSlice"
import Routing from "./Routing/Routing"

const App = () => {
  const cart = useSelector((state) => {
    // ✅ Ensure cart is always an array
    const items = state.cart.items
    return Array.isArray(items) ? items : []
  })
  const userId = useSelector((state) => state.cart.userId)
  const dispatch = useDispatch()

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("mirakleUser"))
      if (userData?.user?._id) {
        dispatch(setUserId(userData.user._id))
        const savedCart = localStorage.getItem(`cart_${userData.user._id}`)
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart)) {
            dispatch(setCartItem(parsedCart))
          } else {
            console.warn("⚠️ Saved cart was not an array, resetting")
            dispatch(setCartItem([]))
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      dispatch(setCartItem([])) // Ensure empty array on error
    }

    dispatch(setCartReady(true))
  }, [dispatch])

  useEffect(() => {
    if (userId && Array.isArray(cart)) {
      try {
        localStorage.setItem(`cart_${userId}`, JSON.stringify(cart))
      } catch (error) {
        console.error("Error saving cart:", error)
      }
    }
  }, [cart, userId])

  return <Routing />
}

export default App
