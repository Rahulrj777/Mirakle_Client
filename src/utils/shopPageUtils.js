// Determine the current title based on URL params and filter type
export const getShopPageTitle = (location, filterType) => {
  const params = new URLSearchParams(location.search)
  const category = params.get("category")
  const urlSearch = params.get("search")
  const discountUpTo = params.get("discountUpTo") // Get discountUpTo param

  if (category) {
    let title = `Products in ${category}`
    if (discountUpTo) {
      title += ` (Up to ${discountUpTo}% Off)`
    }
    return title
  } else if (urlSearch) {
    return `Search Results for "${urlSearch}"`
  } else if (filterType === "offer") {
    let title = "Offer Products"
    if (discountUpTo) {
      title += ` (Up to ${discountUpTo}% Off)`
    }
    return title
  }
  return "All Products"
}
