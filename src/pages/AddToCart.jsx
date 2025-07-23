import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { incrementQuantity, decrementQuantity, removeFromCart, selectAddress, setAddresses, addAddress} from "../Redux/cartSlice";
import { useNavigate } from "react-router-dom";
import { axiosWithToken } from "../utils/axiosWithToken";
import { API_BASE } from "../utils/api";

const AddToCart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const modalRef = useRef();
  const cartItems = useSelector(state => state.cart.items);
  const cartReady = useSelector(state => state.cart.ready);
  const addresses = useSelector(state => state.address.addresses);
  const selectedAddress = useSelector((state) => state.address.selectedAddress);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.currentPrice * item.quantity,
    0
  );
  const originalTotal = cartItems.reduce(
    (acc, item) => acc + item.originalPrice * item.quantity,
    0
  );
  const discountAmount = originalTotal - subtotal;

  if (!cartReady) return <div className="text-center py-10">Loading cart...</div>;

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("mirakleUser"))?.user;
  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;

  // 🛒 Sync cart to backend
  if (user && cartReady) {
    localStorage.setItem(`cart_${user._id}`, JSON.stringify(cartItems));
    axiosWithToken().post("/cart", { items: cartItems }).catch(console.error);
  }

  // 🏠 Load addresses and handle selectedAddress
  if (token) {
    fetch(`${API_BASE}/api/users/address`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.addresses)) {
          dispatch(setAddresses(data.addresses));

          // ✅ Select the one from localStorage if it exists
          const saved = localStorage.getItem("deliveryAddress");
          if (saved) {
            const parsed = JSON.parse(saved);
            const stillExists = data.addresses.some((a) => a._id === parsed._id);
            if (stillExists) {
              dispatch(selectAddress(parsed));
            } else {
              dispatch(selectAddress(null));
              localStorage.removeItem("deliveryAddress");
            }
          }
        }
      })
      .catch(console.error);
  }
}, [cartItems, cartReady, dispatch]);

// ✅ Sync selectedAddress to localStorage every time it changes
useEffect(() => {
  if (selectedAddress) {
    localStorage.setItem("deliveryAddress", JSON.stringify(selectedAddress));
  }
}, [selectedAddress]);

// ✅ Close modal on outside click
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

const confirmDelete = (addressId) => {
  const confirm = window.confirm("Are you sure you want to delete this address?");
  if (confirm) {
    handleDeleteAddress(addressId);
  }
};

const handleDeleteAddress = async (id) => {
  try {
    const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;

    const res = await fetch(`${API_BASE}/api/users/address/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete address: ${errorText}`);
    }

    const data = await res.json();

    if (data.addresses) {
      dispatch(setAddresses(data.addresses));

      // Handle selected address after deletion
      if (selectedAddress?._id === id) {
        localStorage.removeItem("deliveryAddress");

        if (data.addresses.length > 0) {
          dispatch(selectAddress(data.addresses[0]));
          localStorage.setItem("deliveryAddress", JSON.stringify(data.addresses[0]));
        } else {
          dispatch(selectAddress(null));
        }
      }
    }
  } catch (err) {
    console.error("Failed to delete address", err);
    alert("Could not delete address. Try again later.");
  }
};

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Address */}
          <div className="bg-white p-4 rounded shadow flex justify-between items-center">
            {selectedAddress ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Deliver to: {selectedAddress.name}, {selectedAddress.pincode}
                  </p>
                  <p className="text-md">
                    {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.landmark}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Change
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAddressModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Select Address
              </button>
            )}
          </div>

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <p className="text-center py-10 text-gray-600">Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item._id} className="bg-white rounded shadow p-4 flex gap-4">
                <img
                  src={item.images?.others?.[0]?.url || "/placeholder.svg"}
                  alt={item.title}
                  loading="lazy"
                  className="w-28 h-28 object-cover border rounded"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm text-gray-600">Size: {item.weight.value}</p>
                  <p className="text-sm text-gray-500 mb-2">Seller: Mirakle</p>

                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold text-xl">
                      ₹{item.currentPrice.toFixed(2)}
                    </span>
                    {item.originalPrice > item.currentPrice && (
                      <>
                        <span className="line-through text-sm text-gray-500">
                          ₹{item.originalPrice.toFixed(2)}
                        </span>
                        <span className="text-red-500 text-sm font-medium">
                          {Math.round(
                            ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100
                          )}
                          % Off
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center border rounded">
                      <button
                        className="px-3 py-1 text-lg"
                        onClick={() =>
                          dispatch(decrementQuantity({ _id: item._id, variantId: item.variantId }))
                        }
                      >
                        −
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        className="px-3 py-1 text-lg"
                        onClick={() =>
                          dispatch(incrementQuantity({ _id: item._id, variantId: item.variantId }))
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-red-500 text-sm hover:underline"
                      onClick={() => dispatch(removeFromCart(item._id))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right side: Price Details */}
        <div className="bg-white p-6 rounded shadow h-fit sticky top-28">
          <h3 className="text-xl font-bold mb-4">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span>Price ({cartItems.length} item{cartItems.length > 1 ? "s" : ""})</span>
            <span>₹{originalTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount</span>
            <span className="text-green-600">− ₹{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Delivery Charges</span>
            <span className="text-green-600">Free</span>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold"
          >
            PLACE ORDER
          </button>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-y-auto z-50">
          <div
            ref={modalRef}  // Add this ref to modal box
            className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
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
                      localStorage.setItem("deliveryAddress", JSON.stringify(addr)); 
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
    </div>
  );
};

export default AddToCart;
