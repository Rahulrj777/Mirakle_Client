import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../utils/api";

const ProductOffer = () => {
  const [offerImages, setOfferImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/banners`)
      .then((res) => {
        const allBanners = Array.isArray(res.data)
          ? res.data
          : res.data.banners || [];

        const offers = allBanners.filter((img) => img.type === "offer");
        setOfferImages(offers);
      })
      .catch((err) => console.error("Banner fetch failed:", err));
  }, []);

  return (
    <div className="w-[90%] mx-auto py-12">
      <div className="w-full flex flex-col justify-between bg-green-50 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">🎁 Offer Zone</h2>
        <div className="flex flex-col gap-4">
          {offerImages.slice(0, 1).map((banner, i) => (
            <div
              key={banner._id}
              className="rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate("/shop/offerproduct")}
            >
              <img
                src={`${API_BASE}${banner.imageUrl}?v=${banner._id}`}
                alt={banner.title || `Offer ${i + 1}`}
                className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductOffer;
