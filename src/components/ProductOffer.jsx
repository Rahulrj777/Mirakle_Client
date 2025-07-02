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
      {sideImages.map((img, i) => (
        <div
          key={img._id}
          className="rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
        >
          <img
            key={`${img._id}-${i}`}
            src={`${API_BASE}${img.imageUrl}?v=${img._id}`}
            alt="Best Seller"
            className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}

      {offerImages.map((img, i) => (
        <div
          key={img._id}
          className="rounded-lg overflow-hidden shadow hover:shadow-lg transition"
        >
          <img
            key={`${img._id}-${i}`}
            src={`${API_BASE}${img.imageUrl}?v=${img._id}`}
            alt="Offer"
            className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  );
};

export default ProductOffer;
