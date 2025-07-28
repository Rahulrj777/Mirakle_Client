import { useState } from "react";
import axios from "axios";

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus("Sending...");
      await axios.post("https://your-server.com/api/contact", form);
      setStatus("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("Failed to send message.");
    }
  };

  return (
    <div className="...">
      {/* Your existing layout above here */}
      <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-lg font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-lg font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-lg font-medium">Message</label>
          <textarea
            rows="4"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Your message..."
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700"
        >
          Send Message
        </button>

        {status && <p className="text-sm mt-2">{status}</p>}
      </form>
    </div>
  );
};

export default ContactUs;
