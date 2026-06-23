import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, Check, ChevronRight, Globe, ShoppingBag, Stethoscope, Hotel, Car, Shirt, Pill, Building2, Warehouse } from "lucide-react";
import ScaleContainer from "../ScaleContainer";

const industries = [
  { icon: ShoppingBag, name: "Retail Stores", desc: "Manage inventory, track sales, and serve customers faster with smart POS workflows.", color: "bg-blue-500" },
  { icon: Building2, name: "Supermarkets", desc: "Handle thousands of SKUs, manage perishables, and optimize shelf stock automatically.", color: "bg-emerald-500" },
  { icon: Car, name: "Petrol Stations", desc: "Monitor fuel levels, pump sales, and convenience store inventory in real time.", color: "bg-orange-500" },
  { icon: Stethoscope, name: "Hospitals & Pharmacies", desc: "Track medication stock, manage patient billing, and comply with health regulations.", color: "bg-red-500" },
  { icon: Hotel, name: "Hotels", desc: "Streamline room service, restaurant billing, and guest service requests.", color: "bg-purple-500" },
  { icon: Shirt, name: "Fashion Shops", desc: "Manage sizes, colors, returns, and seasonal collections with ease.", color: "bg-pink-500" },
  { icon: Pill, name: "Pharmacies", desc: "Control prescription inventory, expiry tracking, and automated reordering.", color: "bg-cyan-500" },
  { icon: Warehouse, name: "Wholesalers", desc: "Process bulk orders, manage credit accounts, and track delivery logistics.", color: "bg-amber-500" },
];

export default function Industries() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-24 px-4 sm:px-6 md:px-12 bg-slate-50" id="industries">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 mb-4 shadow-sm">
            Industries We Serve
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Built for every business type
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            From single-location shops to enterprise operations, POSIFY adapts to how you work.
          </p>
        </motion.div>

        <div className="grid grid-cols-4 gap-3">
          {industries.map((industry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${industry.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <industry.icon className={`w-6 h-6 ${industry.color.replace('bg-', 'text-')}`} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{industry.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{industry.desc}</p>
              
              <div className="flex items-center text-sm font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Learn more <ChevronRight className="w-4 h-4 ml-1" />
              </div>

              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} 
                   style={{ background: `radial-gradient(600px circle at ${hoveredIndex === index ? '50% 0%' : '0% 0%'}, rgba(37,99,235,0.04), transparent 40%)` }} 
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
