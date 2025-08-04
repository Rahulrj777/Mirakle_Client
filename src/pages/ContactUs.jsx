import { useState } from "react";
import { useSelector } from "react-redux";

const ContactUs = () => {
  const user = useSelector(state => state.user.userInfo);
  const [form, setForm] = useState({ name: "", message: "" });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.email) {
      setStatus("You must be logged in to send a message.");
      return;
    }
    setIsLoading(true);
    setStatus("Sending...");

    try {
      const response = await fetch("https://.../api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth token in header if your API requires it
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`, 
        },
        body: JSON.stringify({
          name: form.name,
          message: form.message,
          // email is taken from backend via token, so not sent here
        }),
        credentials: "include", // if your backend uses cookies/sessions
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to send message");

      setStatus("Message sent successfully!");
      setForm({ name: "", message: "" });
    } catch (err) {
      setStatus("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Email (logged in)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="message" className="block font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            disabled={isLoading}
            rows={4}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Message"}
        </button>

        {status && (
          <p className={`mt-2 ${status.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
            {status}
          </p>
        )}
      </form>
    </div>
  );
};

export default ContactUs;
