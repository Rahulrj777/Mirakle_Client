import React from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { useEffect, useState, useRef, useCallback } from "react"
import axios from "axios"
import { API_BASE } from "../utils/api"
import BannerType1 from "../assets/bannerType1.jpg";
import BannerType2 from "../assets/bannerType2.jpg";
import BannerType3 from "../assets/bannerType3.jpg";


const Banners = () => {

  const [originalImages, setOriginalImages] = useState([]);
  const [sliderImages, setSliderImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const sliderRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [sideBanners, setSideBanners] = useState([]);


  useEffect(() => {
    axios.get(`${API_BASE}/api/banners`).then((res) => {
      const main = res.data.filter((img) => img.type === "main");
      if (main.length) {
        const first = main[0];
        const last = main[main.length - 1];
        setOriginalImages(main);
        setSliderImages([last, ...main, first]);
      }
    });
  }, []);

  const handleSearchChange = async (e) => {
    setSearchTerm(e.target.value)
    if (e.target.value.trim() === "") return setSuggestions([])
    try {
      const res = await axios.get(`${API_BASE}/api/products/search?query=${e.target.value}`)
      setSuggestions(res.data.slice(0, 6))
    } catch (err) {
      setSuggestions([])
    }
  }

  
useEffect(() => {
  axios.get(`${API_BASE}/api/banners`).then((res) => {
    const sides = res.data.filter((img) => img.type === "side")
    setSideBanners(sides)
  })
}, [])

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      <div
        ref={sliderRef}
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{
          width: `${sliderImages.length * 100}%`,
          transform: `translateX(-${(100 / sliderImages.length) * currentIndex}%)`,
        }}
      >
        {sliderImages.map((img, i) => (
          <img
            key={img._id || i}
            src={`${API_BASE}${img.imageUrl}`}
            alt={img.title}
            className="w-full h-full object-cover flex-shrink-0"
            style={{ width: `${100 / sliderImages.length}%` }}
          />
        ))}
      </div>

      <div className="absolute top-0 left-0 w-full z-10 px-10 py-5 flex items-center justify-between text-white">
        <img
          src={logo}
          alt="logo"
          className="w-[150px] h-auto object-contain"
        />

        <ul className="flex items-center gap-6 font-medium text-lg">
          {[
            { path: "/", list: "Home" },
            { path: "/shop/allproduct", list: "Shop" },
            { path: "/About_Us", list: "About Us" },
            { path: "/Contect_Us", list: "Contact Us" },
          ].map((item) => (
            <li key={item.path}>
              <Link to={item.path} className="hover:text-black transition">
                {item.list}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 text-2xl text-white">
          {[FaRegUser, HiOutlineShoppingBag].map((Icon, idx) => (
            <div
              key={idx}
              className="p-2 border border-black rounded-full bg-white text-black hover:bg-gray-100 cursor-pointer"
            >
              <Icon />
            </div>
          ))}
        </div>
      </div>

      <div className="w-[20%] h-full flex flex-col justify-start items-center gap-6 pt-10">
        <input
          type="text"
          placeholder="Search the product..."
          className="w-full px-4 py-2 rounded-full border border-black text-black placeholder-gray-500 focus:outline-none"
        />

        {/* Right stacked banners (dynamic from admin) */}
        {sideBanners.map((img, i) => (
          <div
            key={img._id || i}
            className="relative w-full h-[120px] rounded-xl overflow-hidden shadow hover:scale-105 transition-transform duration-300"
          >
            <img
              src={`${API_BASE}${img.imageUrl}`}
              alt={img.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {img.title || "Banner"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;
