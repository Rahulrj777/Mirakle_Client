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
      {/* Left: Side Images */}
      <div className="flex-1 flex flex-col justify-between bg-white rounded-xl shadow-md p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          🌟 Most Selling Products
        </h2>
        <div
          className="flex flex-wrap gap-4"
          onClick={() => navigate("/shop/allproduct")}
        >
          {sideImages.slice(0, 3).map((img, i) => (
            <div
              key={img._id}
              className="w-full md:w-[48%] lg:w-[30%] rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
            >
              <img
                src={`${API_BASE}${img.imageUrl}?v=${img._id}`}
                alt="Best Seller"
                className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Offer Image */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between bg-green-50 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
          🎁 Offer Zone
        </h2>
        <div
          className="flex flex-col gap-4 cursor-pointer"
          onClick={() => navigate("/shop/offerproduct")}
        >
          {offerImages.slice(0, 1).map((img, i) => (
            <div
              key={img._id}
              className="rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              <img
                src={`${API_BASE}${img.imageUrl}?v=${img._id}`}
                alt="Offer"
                className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductOffer;
