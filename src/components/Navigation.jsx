import React from 'react'
import logo from "../assets/logo.png"


const Navigation = () => {
  return (
    <div>
        <img src={logo || "/placeholder.svg"} alt="logo" className="w-25 h-10 object-contain" />
        <div className="bg-[rgb(119,221,119)]">
            <ul className="max-w-7xl mx-auto px-4 py-2 flex justify-center gap-6 font-semibold text-white text-lg">
            {[
                { path: "/", list: "Home" },
                { path: "/shop/allproduct", list: "Shop" },
                { path: "/About_Us", list: "About Us" },
                { path: "/Contect_Us", list: "Contact Us" },
            ].map((item) => (
                <li key={item.path} className="cursor-pointer flex flex-col items-center">
                <Link
                    to={item.path}
                    className={`hover:text-gray-200 transition-colors ${isActive(item.path) ? "text-white font-bold" : "text-white"}`}
                >
                    {item.list}
                </Link>
                {isActive(item.path) && <hr className="mt-[4px] w-full h-[3px] bg-white rounded-[10px] border-none" />}
                </li>
            ))}
            </ul>
        </div>
        <div className="relative w-full max-w-full mx-4">
            <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Search the product..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {searchTerm.trim() && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-white border mt-1 rounded shadow max-h-80 overflow-y-auto">
                {suggestions.map((item) => (
                <li
                    key={item._id}
                    onClick={() => handleSelectSuggestion(item._id)}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                    <div className="flex items-center gap-3">
                    {item.images?.others?.[0] && (
                        <img
                        src={`${API_BASE}${item.images.others[0]}`}
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded"
                        />
                    )}
                    <div className="flex-1">
                        <div className="font-medium text-sm">{item.title}</div>
                    </div>
                    </div>
                </li>
                ))}
            </ul>
            )}
        </div>
        <div className="flex items-center gap-5 text-[24px] relative">
            {user ? (
            <div ref={dropdownRef} className="relative">
                <div
                className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full cursor-pointer text-lg font-semibold hover:bg-green-700 transition-colors"
                onClick={handleUserClick}
                >
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                {/* ✅ Fixed: Only show dropdown when showDropdown is true */}
                {showDropdown && (
                <div className="absolute top-12 right-0 bg-white shadow-lg rounded-md z-50 w-48 py-2 border">
                    <div className="px-4 py-2 border-b">
                    <p className="text-gray-700 text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">ID: {user._id?.slice(-6)}</p>
                    </div>
                    <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600 transition-colors"
                    >
                    Logout
                    </button>
                </div>
                )}
            </div>
            ) : (
            <span onClick={handleUserClick} className="cursor-pointer hover:text-green-600 transition-colors">
                <FaRegUser className="text-black" />
            </span>
            )}

            {/* Cart icon */}
            <span className="relative cursor-pointer" onClick={handleCartClick}>
            <HiOutlineShoppingBag className="text-black hover:text-green-600 transition-colors" />
            {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
                </span>
            )}
            </span>
        </div>
    </div>
  )
}

export default Navigation
