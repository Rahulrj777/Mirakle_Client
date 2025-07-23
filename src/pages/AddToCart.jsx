import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE } from "../utils/api";
import { axiosWithToken } from "../utils/axiosWithToken";
import { addAddress, removeAddress, selectAddress, setAddresses } from "../redux/slices/addressSlice";
import { useNavigate } from "react-router-dom";

const AddToCart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const addresses = useSelector(state => state.address.addresses);
  const selectedAddress = useSelector(state => state.address.selectedAddress);

  const cartItems = useSelector(state => state.cart.items);
  const cartReady = useSelector(state => state.cart.ready);

  const modalRef = useRef();

  // ✅ 1. Fetch addresses once
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
    if (!token) return;

    fetch(`${API_BASE}/api/users/address`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.addresses) {
          dispatch(setAddresses(data.addresses));
        }
      })
      .catch(console.error);
  }, [dispatch]);

  // ✅ 2. Restore selected address after addresses are loaded
  useEffect(() => {
    if (!addresses.length) return;

    const saved = localStorage.getItem("deliveryAddress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const stillExists = addresses.some(addr => addr._id === parsed._id);

        if (stillExists) {
          dispatch(selectAddress(parsed));
        } else {
          localStorage.removeItem("deliveryAddress");
          dispatch(selectAddress(null));
        }
      } catch (e) {
        console.error("Invalid address in localStorage", e);
      }
    }
  }, [addresses, dispatch]);

  // ✅ 3. Save selected address to localStorage
  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem("deliveryAddress", JSON.stringify(selectedAddress));
    }
  }, [selectedAddress]);

  // ✅ 4. Handle outside modal click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddressModal(false);
      }
    };

    if (showAddressModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddressModal]);

  // ✅ 5. Handle delete
  const handleDeleteAddress = async (id) => {
    try {
      const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;
      const res = await fetch(`${API_BASE}/api/users/address/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        dispatch(setAddresses(data.addresses));

        // If deleted address was selected, reset selection
        if (selectedAddress && selectedAddress._id === id) {
          localStorage.removeItem("deliveryAddress");
          dispatch(selectAddress(null));
        }
      } else {
        console.error("Failed to delete:", data.message);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const confirmDelete = (addressId) => {
    const confirm = window.confirm("Are you sure you want to delete this address?");
    if (confirm) {
      handleDeleteAddress(addressId);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      {/* Delivery Address Section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Delivery Address</h2>
        {selectedAddress ? (
          <div className="border p-3 rounded mt-2">
            <p>{selectedAddress.name}, {selectedAddress.pincode}</p>
            <p className="text-sm text-gray-600">{selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.landmark}</p>
            <button onClick={() => setShowAddressModal(true)} className="text-blue-500 text-sm mt-2 underline">
              Change Address
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddressModal(true)}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Select Delivery Address
          </button>
        )}
      </div>

      {/* Show Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-y-auto z-50">
          <div ref={modalRef} className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-bold mb-4">Select Delivery Address</h2>

            {addresses.length === 0 ? (
              <p className="text-gray-500">No addresses saved yet.</p>
            ) : (
              addresses.map((addr, idx) => (
                <div key={addr._id || idx} className="border p-3 rounded mb-2 relative">
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddress?._id === addr._id}
                    onChange={() => {
                      dispatch(selectAddress(addr));
                      setShowAddressModal(false);
                    }}
                  />
                  <span className="ml-2 font-medium">{addr.name}, {addr.pincode}</span>
                  <p className="text-sm text-gray-600">{addr.line1}, {addr.city}, {addr.landmark}</p>

                  <button
                    onClick={() => confirmDelete(addr._id)}
                    className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}

            <button
              onClick={() => {
                setShowAddressModal(false);
                navigate("/address");
              }}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
            >
              Add New Address
            </button>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div>
        {cartItems.map((item, index) => (
          <div key={index} className="border p-3 rounded mb-2">
            <p>{item.name}</p>
            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddToCart;
