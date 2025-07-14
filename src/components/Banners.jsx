import React from 'react'
import Banner from '../assets/banner.png';
import BannerType1 from '../assets/bannerType1.png';
import BannerType2 from '../assets/bannerType2.png';
import BannerType3 from '../assets/bannerType3.png';

const Banners = () => {
  return (
    <div>
      <div>
        <img src={Banner} alt="" />
      </div>
      <div>
        <img src={BannerType1} alt="" />
        <img src={BannerType2} alt="" />
        <img src={BannerType3} alt="" />
      </div>
    </div>
  )
}

export default Banners
