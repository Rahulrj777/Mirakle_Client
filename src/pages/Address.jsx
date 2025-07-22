import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { addAddress, selectAddress } from "../Redux/cartSlice"

const Address = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [form, setForm] = useState({
    name: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    landmark: "",
    pincode: "",
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        // Call backend API
        fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`)
            .then(res => res.json())
            .then(data => {
            if (data.address) {
                setForm(prev => ({
                ...prev,
                street: data.address.formatted_address,
                }));
            } else {
                alert("Address not found");
            }
            })
            .catch(err => {
            console.error(err);
            alert("Error fetching address");
            });
        },
        (error) => {
        console.error(error);
        alert("Unable to get current location");
        }
    );
    };

  const handleSaveAddress = (e) => {
    e.preventDefault()

    const newAddress = {
      name: form.name,
      phone: form.phone,
      line1: `${form.house}, ${form.street}`,
      city: form.city,
      pincode: form.pincode,
      landmark: form.landmark,
      type: "HOME",
    }

    dispatch(addAddress(newAddress))
    dispatch(selectAddress(newAddress))

    localStorage.setItem("deliveryAddress", JSON.stringify(newAddress))

    navigate("/addtocart")
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
    },
    (error) => {
        alert("Unable to fetch current location");
    }
  );

  fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_API_KEY`)
    .then(res => res.json())
    .then(data => {
        const result = data.results[0];
        if (result) {
        const address = result.formatted_address;
        // Set this in your form or Redux
        }
    });

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Enter Delivery Address</h2>
      
      <form onSubmit={handleSaveAddress} className="space-y-3">
        <input name="name" onChange={handleChange} value={form.name} placeholder="Name" className="w-full p-2 border rounded" required />
        <input name="phone" onChange={handleChange} value={form.phone} placeholder="Phone" className="w-full p-2 border rounded" required />
        <input name="house" onChange={handleChange} value={form.house} placeholder="House No / Flat" className="w-full p-2 border rounded" required />
        <input name="street" onChange={handleChange} value={form.street} placeholder="Street / Road" className="w-full p-2 border rounded" required />
        <input name="landmark" onChange={handleChange} value={form.landmark} placeholder="Landmark (optional)" className="w-full p-2 border rounded" />
        <input name="city" onChange={handleChange} value={form.city} placeholder="City" className="w-full p-2 border rounded" required />
        <input name="pincode" onChange={handleChange} value={form.pincode} placeholder="Pincode" className="w-full p-2 border rounded" required />
        
        <button type="button" onClick={handleUseCurrentLocation} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Use My Current Location
        </button>

        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full">
          Save Address
        </button>
      </form>
    </div>
  )
}

export default Address
