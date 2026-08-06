import { motion } from "framer-motion";

const parallaxLayers = [
  { src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=800&fit=crop", alt: "Modern retail store", speed: 0.3 },
  { src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&h=800&fit=crop", alt: "Coffee shop", speed: 0.2 },
  { src: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1920&h=800&fit=crop", alt: "Supermarket", speed: 0.4 },
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=800&fit=crop", alt: "Restaurant", speed: 0.25 },
  { src: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1920&h=800&fit=crop", alt: "Pharmacy", speed: 0.35 },
  { src: "https://images.unsplash.com/photo-1550009158-9ebf69073b94?w=1920&h=800&fit=crop", alt: "Electronics store", speed: 0.15 },
];

export default function ParallaxBackground() {
  return (
    <div className="relative py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 font-semibold text-sm rounded-full mb-4">
            Industries
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Powering businesses across every sector
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed max-w-3xl mx-auto">
            From retail shops to restaurants, Posify is the trusted POS solution for businesses of all sizes and industries.
          </p>
        </motion.div>
      </div>

      <div className="relative h-[500px] w-full">
        {parallaxLayers.map((layer, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="absolute inset-x-0 h-full"
            style={{ top: `${index * 8}%` }}
          >
            <div
              className="relative h-64 mx-4 rounded-2xl overflow-hidden shadow-lg"
              style={{
                transform: `translateY(${index * 10}px)`,
              }}
            >
              <img
                src={layer.src}
                alt={layer.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-white font-bold text-xl">{layer.alt}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
