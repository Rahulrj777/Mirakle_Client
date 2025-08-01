import { useLocation, Link } from "react-router-dom"
import { FiSearch } from "react-icons/fi"
import { useShopProducts } from "../hooks/useShopProducts"
import { getShopPageTitle } from "../utils/shopPageUtils"

const ShopingPage = () => {
  const location = useLocation()
  const {
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
  } = useShopProducts()
  const pageTitle = getShopPageTitle(location, filterType)

  // ⭐ Render star component
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            fill={rating >= star ? "#facc15" : "none"}
            viewBox="0 0 24 24"
            stroke="#facc15"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.973a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.387 2.46a1 1 0 00-.364 1.118l1.287 3.973c.3.921-.755 1.688-1.54 1.118l-3.387-2.46a1 1 0 00-1.175 0l-3.387 2.46c-.784.57-1.838-.197-1.539-1.118l1.287-3.973a1 1 0 00-.364-1.118l-3.387-2.46c-.784-.57-.38-1.81.588-1.81h4.18a1 1 0 00.951-.69l1.286-3.973z"
            />
          </svg>
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-10">Loading products...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-3 text-center">{pageTitle}</h1>

      {/* Filter Controls */}
      <div className="flex justify-between items-center my-8 flex-wrap gap-4 w-full">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border w-[150px] rounded"
        >
          <option value="all">All Products</option>
          <option value="offer">Offer Products</option>
        </select>

        {/* Search Bar */}
        <div className="relative w-full md:w-1/2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <FiSearch />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search product name..."
            className="pl-10 pr-4 py-2 border rounded w-full"
          />
          {searchTerm.trim() !== "" && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-white shadow-md mt-1 rounded max-h-60 overflow-y-auto border">
              {suggestions.map((product) => (
                <li
                  key={product._id}
                  onClick={() => handleSuggestionClick(product._id)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {product.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {searchTerm && (
        <p className="text-sm text-gray-500 mb-2">
          Showing results for "<strong>{searchTerm}</strong>" and other products.
        </p>
      )}

      {/* Product Grid */}
      {displayedProducts.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayedProducts.map((product) => {
            const variantImage =
              product.variants?.[0]?.images?.[0]?.url ||
              product.images?.others?.[0]?.url || ""

            const hasValidImage =
              typeof variantImage === "string" && variantImage.startsWith("http")

            const imageUrl = hasValidImage
              ? variantImage
              : "/placeholder.svg?height=150&width=150"

            const isOut = product.isOutOfStock
            const variant = product.variants?.[0]
            const discount = variant?.discountPercent || 0
            const originalPrice = variant?.price || 0
            const finalPrice = originalPrice - (originalPrice * discount) / 100

            // Calculate avg rating if missing
            const avgRating =
              product.avgRating && product.avgRating > 0
                ? product.avgRating
                : product.reviews && product.reviews.length > 0
                ? product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
                  product.reviews.length
                : 0

            return (
              <Link to={`/product/${product._id}`} key={product._id} className="block">
                <div
                  className={`relative border rounded-lg shadow transition overflow-hidden cursor-pointer ${
                    isOut ? "opacity-60" : "hover:shadow-lg"
                  }`}
                >
                  {/* Discount badge */}
                  {discount > 0 && !isOut && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      {discount}% OFF
                    </div>
                  )}

                  {/* Out of Stock badge */}
                  {isOut && (
                    <div className="absolute top-3 right-3 bg-red-500 bg-opacity-80 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                      OUT OF STOCK
                    </div>
                  )}

                  <img
                    src={imageUrl || "/placeholder.svg?height=150&width=150"}
                    alt={product.title}
                    loading="lazy"
                    className={`w-full h-40 object-cover hover:scale-105 transition-transform duration-300 rounded-t ${
                      isOut ? "opacity-60" : ""
                    }`}
                  />

                  <div className="p-3">
                    <h2 className="text-base font-semibold truncate" title={product.title}>
                      {product.title}
                    </h2>

                    {variant && (
                      <>
                        <p className="text-sm text-gray-500 mt-1">{variant.size}</p>
                        <div className="mt-2 flex gap-2 items-center">
                          {discount > 0 && (
                            <span className="text-gray-400 line-through text-sm">
                              ₹{originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-green-600 font-bold text-base">
                            ₹{finalPrice.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* ⭐ Rating & Review Count */}
                    {product.reviews && product.reviews.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">{renderStars(avgRating)}</div>
                        <span className="text-xs text-gray-500">
                          ({product.reviews.length})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ShopingPage
