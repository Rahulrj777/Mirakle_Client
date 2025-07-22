// src/components/LocationPicker.jsx
import   { useState, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 12.9716,
  lng: 77.5946,
};

const LocationPicker = () => {
  const [selected, setSelected] = useState(null);
  const [address, setAddress] = useState("");
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyACwPIZL_18a1RfWAiXnfBMWdJEaTEGXtY", 
    libraries: ["places"],
  });

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelected({ lat, lng });

    // Reverse Geocoding
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_API_KEY`
    )
      .then((res) => res.json())
      .then((data) => {
        const result = data?.results?.[0];
        if (result) setAddress(result.formatted_address);
        else setAddress("Address not found");
      })
      .catch(() => setAddress("Failed to fetch address"));
  }, []);

  if (loadError) return <p className="text-red-500">Error loading map</p>;
  if (!isLoaded) return <p className="text-gray-500">Loading Map...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Pick a Delivery Location</h2>
      <div className="rounded-lg overflow-hidden shadow-lg border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={selected || center}
          onClick={handleMapClick}
        >
          {selected && <Marker position={selected} />}
        </GoogleMap>
      </div>

      {selected && (
        <div className="mt-4 bg-white shadow-md p-4 rounded-lg border">
          <h3 className="font-semibold text-lg mb-2">Selected Location:</h3>
          <p><span className="font-medium">Address:</span> {address}</p>
          <p><span className="font-medium">Latitude:</span> {selected.lat.toFixed(6)}</p>
          <p><span className="font-medium">Longitude:</span> {selected.lng.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
