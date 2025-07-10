import axios from "axios"
import { API_BASE } from "./api"

export const axiosWithToken = () => {
  // Get fresh token each time
  const userData = JSON.parse(localStorage.getItem("mirakleUser"))
  const token = userData?.token

  if (!token) {
    console.error("❌ No token found in localStorage")
    // Redirect to login if no token
    window.location.href = "/login_signup"
    throw new Error("No authentication token")
  }

  const instance = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 10000, // 10 second timeout
  })

  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error("❌ Authentication failed, clearing session")
        localStorage.removeItem("mirakleUser")
        window.location.href = "/login_signup"
      }
      return Promise.reject(error)
    },
  )

  return instance
}
