import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../utils/api"; 

const ProductOffer = () => {
  const [sideImages, setSideImages] = useState([]);
  const [offerImages, setOfferImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE}/api/banners`).then((res) => {
      const allBanners = res.data;
      const side = allBanners.filter((img) => img.type === "side");
      const offers = allBanners.filter((img) => img.type === "offer");
      setSideImages(side);
      setOfferImages(offers);
    });
  }, []);

  return (
    <div className="w-[90%] mx-auto py-12 flex flex-col lg:flex-row gap-8">
      {/* Left Side: Most Selling Products */}
      {sideImages.length > 0 && (
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            🌟 Most Selling Products
          </h2>
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            onClick={() => navigate("/shop/allproduct")}
          >
            {sideImages.map((img) => (
              <div
                key={img._id}
                className="rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
              >
                <img
                  src={`${API_BASE}${img.imageUrl}`}
                  alt="Best Seller"
                  className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right Side: Offer Zone */}
      {offerImages.length > 0 && (
        <div className="w-full lg:w-1/3 bg-green-50 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
            🎁 Offer Zone
          </h2>
          <div
            className="gap-4 cursor-pointer"
            onClick={() => navigate("/shop/offerproduct")}
          >
            {offerImages.map((img) => (
              <div
                key={img._id}
                className="rounded-lg overflow-hidden shadow hover:shadow-lg transition"
              >
                <img
                  src={`${API_BASE}${img.imageUrl}`}
                  alt="Offer"
                  className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOffer;
