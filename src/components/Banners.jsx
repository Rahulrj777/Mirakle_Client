import React from 'react'
import Banner from '../assets/banner.png'
import BannerType1 from '../assets/bannerType1.jpg'
import BannerType2 from '../assets/bannerType2.jpg'
import BannerType3 from '../assets/bannerType3.jpg'

const Banners = () => {
  return (
    <div className="flex gap-4">
      {/* Left side: Main banner */}
      <div className="w-2/3">
        <img src={Banner} alt="Main Banner" className="w-full h-full object-cover rounded-xl" />
      </div>

      {/* Right side: 3 stacked banners */}
      <div className="w-1/3 flex flex-col gap-4">
        <img src={BannerType1} alt="Banner 1" className="w-full h-[33%] object-cover rounded-xl" />
        <img src={BannerType2} alt="Banner 2" className="w-full h-[33%] object-cover rounded-xl" />
        <img src={BannerType3} alt="Banner 3" className="w-full h-[33%] object-cover rounded-xl" />
      </div>
    </div>
  )
}

export default Banners
