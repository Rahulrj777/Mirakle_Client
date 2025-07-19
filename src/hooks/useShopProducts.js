"use client"

// This file should be client-side compatible
import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api" // Assuming API_BASE is defined here

const useShopProducts = (initialSearchTerm = "", initialProductType = "") => {
  const [allProducts, setAllProducts] = useState([])
  const [displayedProducts, setDisplayedProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [filterType, setFilterType] = useState(initialProductType) // Renamed from selectedProductType for consistency
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all products initially
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`${API_BASE}/api/products/all-products`)
        setAllProducts(res.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching all products:", err)
        setError("Failed to load products.")
        setLoading(false)
      }
    }
    fetchAllProducts()
  }, []) // Empty dependency array means this runs once on mount

  // Apply local filters and search whenever allProducts, searchTerm, or filterType changes
  useEffect(() => {
    const applyLocalFilters = () => {
      let filtered = [...allProducts]

      // Apply product type filter
      if (filterType && filterType !== "all") {
        if (filterType === "offer") {
          filtered = filtered.filter(
            (product) => product.variants && product.variants.some((variant) => variant.discountPercent > 0),
          )
        } else {
          filtered = filtered.filter((product) => product.productType === filterType)
        }
      }

      // Apply search term filtering and prioritization
      if (searchTerm.trim()) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase()
        const exactMatches = []
        const keywordMatches = []
        const descriptionMatches = []
        const otherMatches = []

        filtered.forEach((product) => {
          const title = product.title?.toLowerCase() || ""
          const keywords = (product.keywords || []).map((k) => k.toLowerCase()).join(" ")
          const description = product.description?.toLowerCase() || ""

          if (title.includes(lowerCaseSearchTerm)) {
            exactMatches.push(product)
          } else if (keywords.includes(lowerCaseSearchTerm)) {
            keywordMatches.push(product)
          } else if (description.includes(lowerCaseSearchTerm)) {
            descriptionMatches.push(product)
          } else {
            otherMatches.push(product)
          }
        })

        // Combine and deduplicate, prioritizing exact matches
        const combined = [...new Set([...exactMatches, ...keywordMatches, ...descriptionMatches, ...otherMatches])]
        setDisplayedProducts(combined)

        // Update suggestions based on current search term
        setSuggestions(combined.slice(0, 5)) // Limit suggestions
      } else {
        setDisplayedProducts(filtered)
        setSuggestions([])
      }
    }

    applyLocalFilters()
  }, [allProducts, searchTerm, filterType])

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleSuggestionClick = useCallback((productId) => {
    // This hook doesn't handle navigation directly, but provides the product ID
    // The component using this hook (ShopingPage) will handle navigation
    // For now, we just clear the search term and suggestions
    setSearchTerm("")
    setSuggestions([])
    // You might want to pass a callback from ShopingPage to navigate here
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      // If Enter is pressed, clear suggestions and apply search
      setSuggestions([])
      // The useEffect will re-filter based on the new searchTerm
    }
  }, [])

  return {
    displayedProducts,
    filterType,
    setFilterType,
    searchTerm,
    suggestions,
    loading,
    error,
    handleSearchChange,
    handleSuggestionClick,
    handleKeyDown,
  }
}

export default useShopProducts
