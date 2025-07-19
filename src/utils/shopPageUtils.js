export function calculateDiscountedPrice(originalPrice, discountPercent) {
  if (typeof originalPrice !== "number" || originalPrice < 0) {
    return "0.00"
  }
  const discount =
    typeof discountPercent === "number" && discountPercent >= 0 && discountPercent <= 100 ? discountPercent : 0
  const finalPrice = originalPrice - (originalPrice * discount) / 100
  return finalPrice.toFixed(2)
}

export function getShopPageTitle(location, filterType) {
  const queryParams = new URLSearchParams(location.search)
  const productTypeParam = queryParams.get("productType")
  const searchTermParam = queryParams.get("search")

  if (searchTermParam) {
    return `Search Results for "${searchTermParam}"`
  } else if (productTypeParam) {
    return `${productTypeParam} Products`
  } else if (filterType === "offer") {
    return "Offer Products"
  } else {
    return "All Products"
  }
}
