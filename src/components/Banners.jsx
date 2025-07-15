import React from 'react'
import Banner from '../assets/banner.png'
import BannerType1 from '../assets/bannerType1.jpg'
import BannerType2 from '../assets/bannerType2.jpg'
import BannerType3 from '../assets/bannerType3.jpg'

const Banners = () => {
  return (
    <div className="flex gap-4 mt-[100px] px-6">
      {/* Left side: Main big banner */}
      <div className="w-[70%] h-[420px]">
        <img
          src={Banner}
          alt="Main Banner"
          className="w-full h-full object-cover rounded-xl shadow-md"
        />
      </div>

      {/* Right side: Smaller 3 stacked banners */}
      <div className="w-[30%] flex flex-col gap-4">
        {[BannerType1, BannerType2, BannerType3].map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Banner ${i + 1}`}
            className="w-full h-[120px] object-cover rounded-xl shadow"
          />
        ))}
      </div>
    </div>
  )
}

export default Banners
