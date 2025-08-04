import { useState } from "react";
import { useSelector } from "react-redux";

const ContactUs = () => {
  const user = useSelector(state => state.user.userInfo); // get logged-in user info from Redux
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
      const response = await fetch("https://mirakle-website-server.onrender.com/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, message: form.message }),
        credentials: "include", // if you use cookies/session auth
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to send message");

      setStatus("Message sent successfully!");
      setForm({ name: "", message: "" });
    } catch (err) {
      console.error("Error:", err);
      setStatus("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>
      <p className="text-lg mb-4 text-center">
        We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, reach out anytime.
      </p>

      <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-lg font-medium">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:opacity-50"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-lg font-medium">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={user?.email || ""}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-lg font-medium">Message</label>
            <textarea
              id="message"
              rows="4"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:opacity-50"
              placeholder="Your message..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isLoading ? "Sending..." : "Send Message"}
          </button>

          {status && (
            <p
              className={`text-sm mt-2 ${status.includes("successfully") ? "text-green-600" : "text-red-600"}`}
              role="alert"
            >
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
