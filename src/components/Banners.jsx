import React from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import Banner from "../assets/banner.jpg"; // Main banner image
import BannerType1 from "../assets/bannerType1.jpg";
import BannerType2 from "../assets/bannerType2.jpg";
import BannerType3 from "../assets/bannerType3.jpg";

const Banners = () => {
  
  return (
    <div className="w-full h-screen flex gap-4 px-4 pt-4">
      {/* Left: Main Banner + Navbar */}
      <div className="w-[80%] h-full relative rounded-xl overflow-hidden">
        <img
          src={Banner}
          alt="Main Banner"
          className="w-full h-full object-cover"
        />

        {/* Navbar over banner */}
        <div className="absolute top-0 left-0 w-full z-10 px-10 py-5 flex items-center justify-between text-white">
          {/* Logo */}
          <img
            src={logo}
            alt="logo"
            className="w-[150px] h-auto object-contain" // Bigger logo
          />

          {/* Navigation Links */}
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

          {/* Icons with black border */}
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
      </div>

      {/* Right: Search + 3 stacked banners */}
      <div className="w-[20%] h-full flex flex-col justify-start items-center gap-6 pt-10">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search the product..."
          className="w-full px-4 py-2 rounded-full border border-black text-black placeholder-gray-500 focus:outline-none"
        />

        {/* Side banners */}
        {[{ img: BannerType1, label: "Oil" }, { img: BannerType2, label: "Seasoning" }, { img: BannerType3, label: "Sauce" }].map((item, i) => (
          <div
            key={i}
            className="relative w-full h-[120px] rounded-xl overflow-hidden shadow"
          >
            <img
              src={item.img}
              alt={`Banner ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;
