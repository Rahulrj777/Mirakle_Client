// SliderSection.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { API_BASE } from "../utils/api"; 

const SliderSection = () => {
  const [originalImages, setOriginalImages] = useState([]);
  const [sliderImages, setSliderImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/banners`).then((res) => {
      const sliders = res.data.filter((img) => img.type === "slider");
      setOriginalImages(sliders);

      if (sliders.length > 0) {
        const first = sliders[0];
        const last = sliders[sliders.length - 1];
        setSliderImages([last, ...sliders, first]);
        setCurrentIndex(1);
      }
    });
  }, []);

  useEffect(() => {
    if (!hovered && originalImages.length > 1) {
      startAutoPlay();
    }
    return stopAutoPlay;
  }, [hovered, currentIndex, originalImages]);

  const startAutoPlay = () => {
    stopAutoPlay();
    intervalRef.current = setInterval(() => {
      slideTo(currentIndex + 1);
    }, 3000);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const slideTo = (index) => {
    if (isTransitioning || !sliderRef.current) return;
    setIsTransitioning(true);
    sliderRef.current.style.transition = "transform 0.5s ease-in-out";
    setCurrentIndex(index);
  };

  const handleTransitionEnd = () => {
    if (!sliderRef.current) return;
    let newIndex = currentIndex;
    sliderRef.current.style.transition = "none";
    if (currentIndex === sliderImages.length - 1) {
      newIndex = 1;
    } else if (currentIndex === 0) {
      newIndex = sliderImages.length - 2;
    }
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 20);
  };

  const handlePrev = () => slideTo(currentIndex - 1);
  const handleNext = () => slideTo(currentIndex + 1);

  return (
    <div
      className="w-[90%] mx-auto relative overflow-hidden h-[370px] rounded-xl mt-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={sliderRef}
        className="flex h-full"
        style={{
          width: `${sliderImages.length * 100}%`,
          transform: `translateX(-${(100 / sliderImages.length) * currentIndex}%)`,
          transition: isTransitioning ? "transform 0.5s ease-in-out" : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {sliderImages.map((img, i) => (
          <img
            key={i}
            src={`${API_BASE}${img.imageUrl}`}
            alt="slider"
            className="w-full h-full object-cover flex-shrink-0"
            style={{ width: `${100 / sliderImages.length}%` }}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-full shadow-md hover:bg-gray-500 cursor-pointer"
      >
        <FiChevronLeft size={24} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-full shadow-md hover:bg-gray-500 cursor-pointer"
      >
        <FiChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
        {originalImages.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i === currentIndex - 1 ? "bg-gray-500" : "bg-gray-300"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SliderSection;
