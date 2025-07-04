import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { API_BASE } from "../utils/api";

const ShopingPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  useEffect(() => {
    setFilterType(location.pathname === '/shop/offerproduct' ? 'offer' : 'all');
  }, [location.pathname]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filterType, searchTerm]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/all-products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const applyFilters = () => {
    let result = [...products];

    if (filterType === 'offer') {
      result = result.filter((p) => p.discountPercent > 0 || p.variants?.some(v => v.discountPercent > 0));
    }

    if (searchTerm.trim()) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(result);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-5 text-center">Shop Products</h1>

      {/* Filters */}
      <div className="flex justify-between items-center my-10 flex-wrap gap-4 w-full">
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
            placeholder="Search product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded w-full"
          />
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => {
            const frontImage = product.images?.others?.[0] || '';
            const isOut = product.isOutOfStock;
            const variant = product.variants?.[0];

            const discount = variant?.discountPercent || 0;
            const originalPrice = variant?.price || 0;
            const finalPrice = originalPrice - (originalPrice * discount) / 100;

            return (
              <Link to={`/product/${product._id}`} key={product._id} className="block">
                <div
                  className={`relative border rounded-lg shadow transition overflow-hidden cursor-pointer ${
                    isOut ? 'opacity-60' : 'hover:shadow-lg'
                  }`}
                >
                  {/* Discount Badge */}
                  {discount > 0 && !isOut && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      {discount}% OFF
                    </div>
                  )}

                  {/* Product Image */}
                  <img
                    src={`${API_BASE}${frontImage}`}
                    alt={product.title}
                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300 rounded-t"
                  />

                  {/* Product Info */}
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
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopingPage;
