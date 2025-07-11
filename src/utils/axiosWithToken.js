import axios from "axios"
import { API_BASE } from "./api"

export const axiosWithToken = () => {
  // Get fresh token each time
  const userData = JSON.parse(localStorage.getItem("mirakleUser"))
  const token = userData?.token

  if (!token) {
    console.error("❌ No token found in localStorage")
    return null // Return null instead of throwing error
  }

  const instance = axios.create({
    baseURL: `${API_BASE}/api`, // Ensure proper API base path
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  })

  // Add response interceptor to handle errors gracefully
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("API Error:", error.response?.status, error.response?.data)

      if (error.response?.status === 401) {
        console.error("❌ Authentication failed, clearing session")
        localStorage.removeItem("mirakleUser")
        // Don't redirect immediately, let component handle it
        return Promise.reject(new Error("Authentication failed"))
      }

      if (error.response?.status === 404) {
        console.error("❌ API endpoint not found:", error.config?.url)
        return Promise.reject(new Error("API endpoint not found"))
      }

      return Promise.reject(error)
    },
  )

  return instance
}

// Safe wrapper for API calls
export const safeApiCall = async (apiCall, fallbackValue = null) => {
  try {
    const axiosInstance = axiosWithToken()
    if (!axiosInstance) {
      return fallbackValue
    }
    return await apiCall(axiosInstance)
  } catch (error) {
    console.error("Safe API call failed:", error.message)
    return fallbackValue
  }
}
