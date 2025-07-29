"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { axiosWithToken } from "../utils/axiosWithToken"
import { API_BASE } from "../utils/api"

// Service to handle stock notifications
export const NotificationService = {
  // Send notification when product is back in stock
  sendStockNotification: async (productId, variantId, adminToken) => {
    try {
      const response = await axiosWithToken(adminToken).post(`${API_BASE}/api/notifications/stock-available`, {
        productId,
        variantId,
      })
      return response.data
    } catch (error) {
      console.error("Failed to send stock notification:", error)
      throw error
    }
  },

  // Create notification request when user clicks "Notify me"
  createNotificationRequest: async (data, userToken) => {
    try {
      const response = await axiosWithToken(userToken).post(`${API_BASE}/api/notifications/request`, data)
      return response.data
    } catch (error) {
      console.error("Failed to create notification request:", error)
      throw error
    }
  },

  // Get user notifications
  getUserNotifications: async (userToken) => {
    try {
      const response = await axiosWithToken(userToken).get(`${API_BASE}/api/notifications`)
      return response.data
    } catch (error) {
      console.error("Failed to get notifications:", error)
      return []
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId, userToken) => {
    try {
      const response = await axiosWithToken(userToken).patch(`${API_BASE}/api/notifications/${notificationId}/read`)
      return response.data
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      throw error
    }
  },
}

// Hook for real-time notifications (optional - for future WebSocket implementation)
export const useNotifications = () => {
  const user = useSelector((state) => state.user)

  useEffect(() => {
    if (!user?.token) return

    // Here you could implement WebSocket connection for real-time notifications
    // For now, we'll use polling in the Header component

    return () => {
      // Cleanup WebSocket connection
    }
  }, [user?.token])

  return {
    // Return notification methods if needed
  }
}

export default NotificationService
