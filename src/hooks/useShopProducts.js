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

  // Function to fetch products based on URL parameters (category or search)
  const fetchProductsBasedOnUrl = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams(location.search)
    const category = params.get("category")
    const urlSearch = params.get("search") // This is the search from URL

    let apiUrl = `${API_BASE}/api/products/all-products`

    if (category) {
      apiUrl += `?productType=${encodeURIComponent(category)}`
      console.log(`Fetching products for category: ${category}`)
    } else if (urlSearch) {
      apiUrl = `${API_BASE}/api/products/search?query=${encodeURIComponent(urlSearch)}`
      console.log(`Searching products for term from URL: ${urlSearch}`)
      setSearchTerm(urlSearch) // Set local search term from URL search
    } else {
      console.log("Fetching all products (no specific URL filter)")
      setSearchTerm("") // Clear local search term if no URL search
    }

    try {
      const res = await axios.get(apiUrl)
      setProducts(res.data) // Set the base products based on URL filter
    } catch (err) {
      console.error("Failed to fetch products:", err)
      setError(err.response?.data?.message || err.message || "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [location.search])

  // Effect to fetch products when URL search params change
  useEffect(() => {
    fetchProductsBasedOnUrl()

    // Clean up URL after 2s if it was a search param
    const params = new URLSearchParams(location.search)
    const query = params.get("search")
    const discountUpTo = params.get("discountUpTo") // Also clear discountUpTo
    if (query || discountUpTo) {
      setTimeout(() => {
        params.delete("search")
        params.delete("discountUpTo") // Clear discountUpTo
        navigate(`${location.pathname}?${params.toString()}`, { replace: true })
      }, 2000)
    }
  }, [location.search, fetchProductsBasedOnUrl, navigate])

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
      const strongMatches = []
      const otherProducts = []

      result.forEach((p) => {
        const titleMatch = p.title.toLowerCase().includes(lowerSearchTerm)
        const keywordsMatch = (p.keywords || []).some((k) => k.toLowerCase().includes(lowerSearchTerm))
        const descriptionMatch = (p.description || "").toLowerCase().includes(lowerSearchTerm)

        if (titleMatch || keywordsMatch) {
          strongMatches.push(p)
        } else if (descriptionMatch) {
          otherProducts.push(p) // Products matching only description go after strong matches
        } else {
          otherProducts.push(p) // All other products
        }
      })

      // Combine strong matches first, then others. Remove duplicates if any.
      const combined = [...new Set([...strongMatches, ...otherProducts])]
      result = combined
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
