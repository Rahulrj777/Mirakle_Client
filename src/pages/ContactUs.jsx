import React, { useState } from "react";
import axios from "axios";

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      await axios.post("https://mirakle-server.vercel.app/api/contact", form);
      setStatus("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Error sending message:", err);
      setStatus("Failed to send message.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>

      <p className="text-lg mb-4 text-center">
        We'd love to hear from you! Whether you have a question, feedback, or just want to say hello,
        reach out to us anytime.
      </p>

      <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Email</h2>
          <p className="text-lg">miraklefoodproducts@gmail.com</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Phone</h2>
          <p className="text-lg">+91 63838 42861</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Support Hours</h2>
          <p className="text-lg">24×7 Available</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Expected Response Time</h2>
          <p className="text-lg">Within 24 hours</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Follow Us</h2>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="text-blue-500 hover:underline">Instagram</a>
            <a href="#" className="text-blue-500 hover:underline">Facebook</a>
            <a href="#" className="text-blue-500 hover:underline">YouTube</a>
          </div>
        </div>

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
    </div>
  );
};

export default ContactUs;
