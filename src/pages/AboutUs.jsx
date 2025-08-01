// import { motion } from "framer-motion";
// import Natural from "../assets/Natural.png";
// import Preservatives from "../assets/Preservatives.png";
// import Satisfaction from "../assets/Satisfaction.png";
// import Health from "../assets/healthy.png";
// import MissionImg from "../assets/mission.jpg"; 
// import HeroImg from "../assets/hero-products.png";

// const AboutUs = () => {
//   const coreValues = [
//     { title: "100% Natural Ingredients", img: Natural },
//     { title: "No Preservatives", img: Preservatives },
//     { title: "Customer Satisfaction", img: Satisfaction },
//     { title: "Health & Purity First", img: Health },
//   ];

//   return (
//     <div className="bg-gray-50">
//       {/* Hero Section */}
//       <section className="relative bg-gradient-to-r from-green-500 to-green-700 text-white py-16 px-6 md:px-12">
//         <div className="max-w-6xl mx-auto text-center">
//           <motion.h1
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="text-5xl md:text-6xl font-extrabold mb-4"
//           >
//             About <span className="text-yellow-300">Mirakle</span>
//           </motion.h1>
//           <motion.p
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1, delay: 0.3 }}
//             className="text-lg md:text-xl max-w-3xl mx-auto"
//           >
//             Bringing 100% natural flavors to your kitchen since 2025 — Pure Masalas, Sauces & Food Essentials.
//           </motion.p>
//         </div>
//         <img
//           src={HeroImg}
//           alt="Mirakle Products"
//           className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 opacity-20"
//         />
//       </section>

//       {/* Mission Section */}
//       <section className="max-w-6xl mx-auto px-6 py-16 md:px-12">
//         <div className="grid md:grid-cols-2 gap-12 items-center">
//           <motion.img
//             src={MissionImg}
//             alt="Mission"
//             className="rounded-2xl shadow-lg w-full object-cover"
//             initial={{ opacity: 0, scale: 0.9 }}
//             whileInView={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.8 }}
//             loading="lazy"
//           />
//           <motion.div
//             initial={{ opacity: 0, x: 50 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.8 }}
//           >
//             <h2 className="text-3xl font-bold text-green-700 mb-4">Our Mission</h2>
//             <p className="text-lg text-gray-700 mb-4">
//               To deliver high-quality, chemical-free, and preservative-free food products
//               that capture the essence of traditional taste while promoting health and wellness.
//             </p>
//             <p className="text-lg text-gray-700">
//               We believe in the power of nature, creating products that are 100% natural and
//               crafted with love for every kitchen.
//             </p>
//           </motion.div>
//         </div>
//       </section>

//       {/* Core Values Section */}
//       <section className="bg-white py-16">
//         <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
//           <motion.h2
//             className="text-3xl font-bold text-green-700 mb-10"
//             initial={{ opacity: 0, y: 50 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//           >
//             Our Core Values
//           </motion.h2>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
//             {coreValues.map((value, i) => (
//               <motion.div
//                 key={i}
//                 className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all flex flex-col items-center"
//                 initial={{ opacity: 0, y: 50 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: i * 0.2 }}
//               >
//                 <img
//                   src={value.img}
//                   alt={value.title}
//                   className="w-24 h-24 object-cover rounded-full mb-4 border-4 border-green-100"
//                   loading="lazy"
//                 />
//                 <h3 className="font-semibold text-lg text-gray-800">{value.title}</h3>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="bg-green-600 text-white py-16 text-center">
//         <motion.h2
//           className="text-3xl md:text-4xl font-bold mb-4"
//           initial={{ opacity: 0, y: 40 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           Join Our Natural Journey
//         </motion.h2>
//         <motion.p
//           className="text-lg max-w-2xl mx-auto mb-8"
//           initial={{ opacity: 0, y: 40 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1 }}
//         >
//           Follow us and be part of our mission to bring natural, preservative-free flavors to
//           every kitchen.
//         </motion.p>
//         <motion.a
//           href="/shop/allproduct"
//           className="inline-block bg-yellow-400 text-green-800 font-semibold px-6 py-3 rounded-lg shadow hover:bg-yellow-300 transition"
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//         >
//           Explore Products
//         </motion.a>
//       </section>
//     </div>
//   );
// };

// export default AboutUs;
