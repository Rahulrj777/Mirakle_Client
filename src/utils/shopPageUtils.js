export const calculateDiscountedPrice = (originalPrice, discountPercent) => {
  if (originalPrice === undefined || originalPrice === null) {
    return "N/A"
  }
  if (discountPercent > 0) {
    const discountedPrice = originalPrice * (1 - discountPercent / 100)
    return discountedPrice.toFixed(2)
  }
  return originalPrice.toFixed(2)
}

export const getShopPageTitle = (location, selectedProductType) => {
  const params = new URLSearchParams(location.search)
  const searchTerm = params.get("search")
  const discountUpTo = params.get("discountUpTo")

  if (searchTerm) {
    return `Search Results for "${searchTerm}"`
  } else if (location.pathname === "/shop/offerproduct") {
    return "Special Offers"
  } else if (discountUpTo) {
    return `Products with up to ${discountUpTo}% Discount`
  } else if (selectedProductType && selectedProductType !== "all") {
    return `${selectedProductType} Products`
  } else {
    return "All Products"
  }
}
