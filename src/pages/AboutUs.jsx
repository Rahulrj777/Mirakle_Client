// AboutUs.jsx
import React from "react";

const AboutUs = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-4xl font-bold mb-6 text-center">About Mirakle</h1>

      <p className="mb-4 text-lg">
        At <strong>Mirakle</strong>, our passion is to bring 100% natural food products to your kitchen.
        Established in 2025, we specialize in crafting pure masalas, sauces, and other flavorful additions
        made without any artificial colors or chemicals.
      </p>

      <p className="mb-4 text-lg">
        Our journey started with a simple idea — to make cooking healthier and tastier using nature's own
        ingredients. Today, Mirakle stands for quality, honesty, and purity.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
      <p className="mb-4 text-lg">
        To deliver high-quality, chemical-free, and preservative-free food products that preserve the essence of traditional taste while promoting well-being.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Our Core Values</h2>
      <ul className="list-disc list-inside text-lg space-y-2">
        <li>100% Natural Ingredients</li>
        <li>No Artificial Colors or Preservatives</li>
        <li>Customer Satisfaction</li>
        <li>Health & Purity First</li>
        <li>Affordable Quality</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
      <p className="mb-4 text-lg">
        We currently offer a range of handcrafted masalas, sauces, and food essentials. Each product goes
        through strict quality checks to ensure it meets our natural standards.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Join Us On Our Journey</h2>
      <p className="text-lg">
        Whether you’re a home cook or a food lover, we welcome you to experience the magic of natural flavors
        with Mirakle. Follow us on social media and be part of our growing community.
      </p>
    </div>
  );
};

export default AboutUs;