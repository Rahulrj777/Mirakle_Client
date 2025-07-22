import { useState } from "react";
import { useLoadScript } from "@react-google-maps/api";

const Address = () => {
  const [form, setForm] = useState({
    street: "",
    landmark: "",
    city: "",
    pincode: "",
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyACwPIZL_18a1RfWAiXnfBMWdJEaTEGXtY", // ✅ Use your key
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      // Reverse geocode
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyACwPIZL_18a1RfWAiXnfBMWdJEaTEGXtY`
      );
      const data = await response.json();

      const address = data.results[0];
      if (address) {
        const components = address.address_components;

        const getComponent = (types) =>
          components.find((c) => types.every((t) => c.types.includes(t)))?.long_name || "";

        setForm({
          street: getComponent(["route"]) + " " + getComponent(["sublocality_level_1"]),
          landmark: getComponent(["point_of_interest"]) || "",
          city: getComponent(["locality"]) || getComponent(["administrative_area_level_2"]),
          pincode: getComponent(["postal_code"]),
        });
      } else {
        alert("Address not found");
      }
    });
  };

  if (!isLoaded) return <div>Loading map scripts...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Enter Delivery Address</h2>

      <div className="space-y-4">
        <input
          type="text"
          name="street"
          value={form.street}
          onChange={handleChange}
          placeholder="Street / Address line"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="landmark"
          value={form.landmark}
          onChange={handleChange}
          placeholder="Landmark"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="City"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="pincode"
          value={form.pincode}
          onChange={handleChange}
          placeholder="Pincode"
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleUseCurrentLocation}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Use My Current Location
        </button>

        <button
          onClick={() => console.log("Submit", form)}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Save Address
        </button>
      </div>
    </div>
  );
};

export default Address;
