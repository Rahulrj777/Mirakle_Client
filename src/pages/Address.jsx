// pages/SelectAddress.jsx or any page
import React from "react";
import LocationPicker from "../components/LocationPicker";

const SelectAddress = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <LocationPicker />
    </div>
  );
};

export default SelectAddress;
