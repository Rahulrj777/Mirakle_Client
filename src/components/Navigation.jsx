import React from 'react'
import logo from "../assets/logo.png"


const Navigation = () => {
  return (
    <div>
        <img src={logo || "/placeholder.svg"} alt="logo" className="w-25 h-10 object-contain" />
    </div>
  )
}

export default Navigation
