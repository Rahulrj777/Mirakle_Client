import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux";
import { setAddress } from "../Redux/cartSlice";

const AddressPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    pincode: "",
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords

        // Reverse Geocode
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_API_KEY`)
          .then(res => res.json())
          .then(data => {
            const addressObj = data.results[0]
            if (addressObj) {
              setForm({
                ...form,
                street: addressObj.formatted_address,
              })
            } else {
              alert("Address not found, please enter manually.")
            }
          })
          .catch(() => alert("Address not found, please enter manually."))
      },
      () => {
        alert("Unable to detect location. Please enter manually.")
      }
    )
  }

  const handleSaveAddress = () => {
    dispatch(setAddress(form));
    localStorage.setItem("deliveryAddress", JSON.stringify(form));
    navigate("/AddToCart");
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Enter Delivery Address</h2>
      
      <div className="space-y-3">
        <input name="name" onChange={handleChange} value={form.name} placeholder="Name" className="w-full p-2 border rounded" />
        <input name="phone" onChange={handleChange} value={form.phone} placeholder="Phone" className="w-full p-2 border rounded" />
        <input name="house" onChange={handleChange} value={form.house} placeholder="House No / Flat" className="w-full p-2 border rounded" />
        <input name="street" onChange={handleChange} value={form.street} placeholder="Street / Landmark" className="w-full p-2 border rounded" />
        <input name="city" onChange={handleChange} value={form.city} placeholder="City" className="w-full p-2 border rounded" />
        <input name="pincode" onChange={handleChange} value={form.pincode} placeholder="Pincode" className="w-full p-2 border rounded" />
        
        <button onClick={handleUseCurrentLocation} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Use My Current Location
        </button>

        <button onClick={handleSaveAddress} className="bg-green-500 text-white px-4 py-2 rounded w-full">
          Save Address
        </button>
      </div>
    </div>
  )
}

export default AddressPage
