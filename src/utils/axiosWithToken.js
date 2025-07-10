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
    baseURL: `${API_BASE}`, // Ensure proper API base path
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 15000, // Increased timeout
  })

  // Add request interceptor for debugging
  instance.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? "Bearer [TOKEN]" : "No auth",
        },
        data: config.data,
      })
      return config
    },
    (error) => {
      console.error("❌ Request interceptor error:", error)
      return Promise.reject(error)
    },
  )

  // Add response interceptor to handle errors gracefully
  instance.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
        data: response.data,
      })
      return response
    },
    (error) => {
      console.error("❌ API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        message: error.message,
      })

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

      if (error.response?.status === 500) {
        console.error("❌ Server error:", error.response?.data)
        return Promise.reject(new Error(error.response?.data?.message || "Server error"))
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
      console.warn("⚠️ No axios instance available (no token)")
      return fallbackValue
    }
    const result = await apiCall(axiosInstance)
    return result?.data || result
  } catch (error) {
    console.error("❌ Safe API call failed:", error.message)
    return fallbackValue
  }
}
