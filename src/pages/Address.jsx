import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { selectAddress,setAddresses } from "../Redux/cartSlice"
import { API_BASE } from "../utils/api"

const Address = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [setShowAddressForm] = useState(false);
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
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude
        const longitude = pos.coords.longitude
        fetch(`${API_BASE}/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            console.log("Google Geocode Response:", data)
            const result = data.results[0]
            if (result) {
              setForm((prev) => ({
                ...prev,
                street: result.formatted_address,
                city: result.address_components.find((c) => c.types.includes("locality"))?.long_name || "",
                pincode: result.address_components.find((c) => c.types.includes("postal_code"))?.long_name || "",
              }))
            } else {
              alert("Address not found")
            }
          })
          .catch((err) => {
            console.error(err)
            alert("Error fetching address")
          })
      },
      (error) => {
        console.error(error)
        alert("Unable to get current location")
      },
    )
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    console.log("Saving address...");

    const newAddress = {
      name: form.name,
      phone: form.phone,
      line1: `${form.house}, ${form.street}`,
      city: form.city,
      pincode: form.pincode,
      landmark: form.landmark,
      type: "HOME",
    };

    try {
      const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
      if (!token) {
        alert("Login required");
        return;
      }

      // Determine if we are editing or adding
      const method = editingAddressId ? "PUT" : "POST";
      const url = editingAddressId
        ? `${API_BASE}/api/users/address/${editingAddressId}`
        : `${API_BASE}/api/users/address`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedAddress =
          method === "POST"
            ? data.addresses[data.addresses.length - 1] // new one
            : data.addresses.find((a) => a._id === editingAddressId); // edited one

            console.log("setAddresses", setAddresses, typeof setAddresses);
            console.log("selectAddress", selectAddress, typeof selectAddress);

        // Update Redux and LocalStorage
        dispatch(selectAddress(updatedAddress));
        dispatch(setAddresses(data.addresses));
        localStorage.setItem("deliveryAddress", JSON.stringify(updatedAddress));

        // Reset editing state and close modal
        setEditingAddressId(null);
        setShowAddressForm(false);

        if (!editingAddressId) {
          navigate("/addtocart"); // only redirect on add
        }
      } else {
        throw new Error(data.message || "Failed to save address");
      }
    } catch (err) {
      console.error("Failed to save address:", err);
      alert("Could not save address");
    }
  };
  console.log("handleSaveAddress is", typeof handleSaveAddress);

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Enter Delivery Address</h2>

      <form onSubmit={handleSaveAddress} className="space-y-3">
        <input
          name="name"
          onChange={handleChange}
          value={form.name}
          placeholder="Name"
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="phone"
          type="tel"
          onChange={handleChange}
          value={form.phone}
          placeholder="Phone"
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="house"
          onChange={handleChange}
          value={form.house}
          placeholder="House No / Flat"
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="street"
          onChange={handleChange}
          value={form.street}
          placeholder="Street / Road"
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="landmark"
          onChange={handleChange}
          value={form.landmark}
          placeholder="Landmark (optional)"
          className="w-full p-2 border rounded"
        />
        <input
          name="city"
          onChange={handleChange}
          value={form.city}
          placeholder="City"
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="pincode"
          onChange={handleChange}
          value={form.pincode}
          placeholder="Pincode"
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
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
