"use client" // This directive is necessary because this file uses React Hooks

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom" // Hooks from react-router-dom
import { API_BASE } from "../utils/api"

export const useShopProducts = () => {
  const [products, setProducts] = useState([]) // Stores products fetched based on URL params (category/search)
  const [displayedProducts, setDisplayedProducts] = useState([]) // Products after local filters (offer, local search)
  const [filterType, setFilterType] = useState("all") // 'all' or 'offer'
  const [searchTerm, setSearchTerm] = useState("") // Local search input
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()

  // Update fetchProductsBasedOnUrl to always fetch all products or products by category,
  // and then apply URL search term filtering locally.
  // Replace the existing fetchProductsBasedOnUrl function with this:

  const fetchProductsBasedOnUrl = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams(location.search)
    const category = params.get("category")
    const urlSearch = params.get("search")

    let apiUrl = `${API_BASE}/api/products/all-products` // Always fetch all initially

    // If a category is selected, filter by it.
    if (category) {
      apiUrl += `?productType=${encodeURIComponent(category)}`
      console.log(`Fetching products for category: ${category}`)
    } else {
      console.log("Fetching all products (no specific URL category filter)")
    }

    try {
      const res = await axios.get(apiUrl)
      setProducts(res.data) // Set the base products based on URL category filter
      if (urlSearch) {
        setSearchTerm(urlSearch) // Set local search term from URL search
      } else {
        setSearchTerm("") // Clear local search term if no URL search
      }
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setError(err.response?.data?.message || err.message || "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [location.search])

  // Remove the setTimeout block in the `useEffect` related to location.search.
  // Replace the entire `useEffect` block that handles cleaning up URL search params with the following:

  useEffect(() => {
    fetchProductsBasedOnUrl()
    // Removed setTimeout for clearing URL params to prevent potential double-navigation issues.
    // Navigation params are now handled dynamically by fetchProductsBasedOnUrl and applyLocalFilters.
  }, [location.search, fetchProductsBasedOnUrl])

  // Effect to set filterType based on path (for offer products)
  useEffect(() => {
    setFilterType(location.pathname === "/shop/offerproduct" ? "offer" : "all")
  }, [location.pathname])

  // Function to apply local filters (offer, local search, discountUpTo)
  const applyLocalFilters = useCallback(() => {
    let result = [...products] // Start with products fetched based on URL

    // Apply offer filter (if path is /shop/offerproduct)
    if (filterType === "offer") {
      result = result.filter((p) => p.discountPercent > 0 || p.variants?.some((v) => v.discountPercent > 0))
    }

    // Apply discountUpTo filter from URL
    const params = new URLSearchParams(location.search)
    const discountUpTo = Number(params.get("discountUpTo"))
    if (!isNaN(discountUpTo) && discountUpTo > 0) {
      result = result.filter((product) =>
        product.variants.some(
          (variant) => (variant.discountPercent || 0) <= discountUpTo && (variant.discountPercent || 0) > 0,
        ),
      )
    }

    // ✅ NEW: Apply local search filter and reorder
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      const titleMatches = []
      const keywordMatches = []
      const descriptionMatches = []
      const otherProducts = []

      result.forEach((p) => {
        const titleMatch = p.title.toLowerCase().includes(lowerSearchTerm)
        const keywordsMatch = (p.keywords || []).some((k) => k.toLowerCase().includes(lowerSearchTerm))
        const descriptionMatch = (p.description || "").toLowerCase().includes(lowerSearchTerm)

        if (titleMatch) {
          titleMatches.push(p)
        } else if (keywordsMatch) {
          keywordMatches.push(p)
        } else if (descriptionMatch) {
          descriptionMatches.push(p)
        } else {
          otherProducts.push(p)
        }
      })

      // Combine and ensure uniqueness while maintaining order
      const finalResult = [
        ...new Set(titleMatches), // Products matching title first
        ...new Set(keywordMatches.filter((p) => !titleMatches.includes(p))), // Then products matching keywords (not already in title matches)
        ...new Set(descriptionMatches.filter((p) => !titleMatches.includes(p) && !keywordMatches.includes(p))), // Then products matching description (not already in title/keyword matches)
        ...new Set(
          otherProducts.filter(
            (p) => !titleMatches.includes(p) && !keywordMatches.includes(p) && !descriptionMatches.includes(p),
          ),
        ), // Finally, all other products
      ]
      result = finalResult
    }

    setDisplayedProducts(result)
  }, [products, filterType, searchTerm, location.search]) // Add location.search to dependencies

  // Effect to apply local filters whenever base products, filterType, or local searchTerm changes
  useEffect(() => {
    applyLocalFilters()
  }, [products, filterType, searchTerm, applyLocalFilters])

  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    try {
      // Always use the search API for suggestions
      const res = await axios.get(`${API_BASE}/api/products/search?query=${value}`)
      setSuggestions(res.data)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    }
  }, [])

  const handleSuggestionClick = useCallback(
    (id) => {
      navigate(`/product/${id}`)
      setSearchTerm("") // Clear search term after navigating
      setSuggestions([])
    },
    [navigate],
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && searchTerm.trim()) {
        // When user presses Enter in search, apply local filter
        applyLocalFilters()
        setSuggestions([])
      }
    },
    [searchTerm, applyLocalFilters],
  )

  return {
    displayedProducts,
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    suggestions,
    loading,
    error,
    handleSearchChange,
    handleSuggestionClick,
    handleKeyDown,
  }
}
