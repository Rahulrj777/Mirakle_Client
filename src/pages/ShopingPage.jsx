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
            const frontImage = product.images?.others?.[0]?.url || ""
            const isOut = product.isOutOfStock
            const variant = product.variants?.[0]
            const discount = variant?.discountPercent || 0
            const originalPrice = variant?.price || 0
            const finalPrice = originalPrice - (originalPrice * discount) / 100

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
                    src={frontImage || "/placeholder.svg?height=150&width=150"}
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
                            <span className="text-gray-400 line-through text-sm">₹{originalPrice.toFixed(2)}</span>
                          )}
                          <span className="text-green-600 font-bold text-base">₹{finalPrice.toFixed(2)}</span>
                        </div>
                      </>
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
