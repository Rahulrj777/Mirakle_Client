import React from 'react'
import Banner from '../assets/banner.png'
import BannerType1 from '../assets/bannerType1.jpg'
import BannerType2 from '../assets/bannerType2.jpg'
import BannerType3 from '../assets/bannerType3.jpg'

const Banners = () => {
  return (
    <div className="flex max-w-[1200px] mx-auto mt-6 gap-4">
      {/* Main Banner */}
      <div className="w-2/3">
        <img src={Banner} alt="Main Banner" className="w-full h-full rounded-xl object-cover" />
      </div>

      {/* Side Banners */}
      <div className="w-1/3 flex flex-col gap-4">
        <img src={BannerType1} alt="Banner 1" className="w-full h-[33%] rounded-xl object-cover" />
        <img src={BannerType2} alt="Banner 2" className="w-full h-[33%] rounded-xl object-cover" />
        <img src={BannerType3} alt="Banner 3" className="w-full h-[33%] rounded-xl object-cover" />
      </div>
    </div>
  )
}

export default Banners
