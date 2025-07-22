import { useState, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const center = {
  lat: 12.9716,
  lng: 77.5946,
};

const AddressPage = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyACwPIZL_18a1RfWAiXnfBMWdJEaTEGXtY", // ✅ your key
    libraries: ["places"],
  });

  const [form, setForm] = useState({
    street: "",
    landmark: "",
    city: "",
    pincode: "",
    lat: null,
    lng: null,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setForm((prev) => ({ ...prev, lat: latitude, lng: longitude }));

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyACwPIZL_18a1RfWAiXnfBMWdJEaTEGXtY`
      );
      const data = await response.json();

      const result = data?.results?.[0];
      if (result) {
        const components = result.address_components;

        const get = (types) =>
          components.find((c) => types.every((t) => c.types.includes(t)))?.long_name || "";

        setForm({
          street: get(["route"]) + " " + get(["sublocality_level_1"]),
          landmark: get(["point_of_interest"]) || "",
          city: get(["locality"]) || get(["administrative_area_level_2"]),
          pincode: get(["postal_code"]),
          lat: latitude,
          lng: longitude,
        });
      }
    });
  };

  const handleMapClick = useCallback(async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setForm((prev) => ({ ...prev, lat, lng }));

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyACwPIZL_18a1RfWAiXnfBMWdJEaTEGXtY`
    );
    const data = await response.json();

    const result = data?.results?.[0];
    if (result) {
      const components = result.address_components;

      const get = (types) =>
        components.find((c) => types.every((t) => c.types.includes(t)))?.long_name || "";

      setForm({
        street: get(["route"]) + " " + get(["sublocality_level_1"]),
        landmark: get(["point_of_interest"]) || "",
        city: get(["locality"]) || get(["administrative_area_level_2"]),
        pincode: get(["postal_code"]),
        lat,
        lng,
      });
    }
  }, []);

  if (loadError) return <p>Error loading map</p>;
  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded space-y-4">
      <h2 className="text-2xl font-bold mb-4">Enter Address</h2>

      <input
        type="text"
        name="street"
        value={form.street}
        onChange={handleChange}
        placeholder="Street / Address"
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
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Use Current Location
      </button>

      <div className="mt-6">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={form.lat ? { lat: form.lat, lng: form.lng } : center}
          onClick={handleMapClick}
        >
          {form.lat && <Marker position={{ lat: form.lat, lng: form.lng }} />}
        </GoogleMap>
      </div>

      <button
        onClick={() => console.log("Submit Address", form)}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-4"
      >
        Save Address
      </button>
    </div>
  );
};

export default AddressPage;
