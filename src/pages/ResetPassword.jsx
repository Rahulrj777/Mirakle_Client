import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../utils/api"; 

const ResetPassword = () => {
  const { token } = useParams(); // URL param from email
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/reset-password`, {
        token,
        password,
      });
      alert("✅ Password reset successful!");
      navigate("/login"); // or homepage
    } catch (err) {
      alert("❌ " + err.response.data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white shadow-md rounded-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-green-600 text-center">
          Reset Your Password
        </h2>
        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full p-2 mb-6 border rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          onClick={handleReset}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
