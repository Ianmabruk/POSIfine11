import { motion } from "framer-motion";

const industries = [
  {
    name: "Retail Shops",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
    description: "Streamline checkout and manage inventory effortlessly",
  },
  {
    name: "Supermarkets",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop",
    description: "Handle high-volume transactions with speed and accuracy",
  },
  {
    name: "Restaurants",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    description: "Table management, orders, and kitchen integration",
  },
  {
    name: "Pharmacies",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop",
    description: "Expiry tracking, prescriptions, and compliance-ready records",
  },
  {
    name: "Electronics Stores",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69073b94?w=600&h=400&fit=crop",
    description: "Serial tracking, warranties, and product catalogs",
  },
  {
    name: "Hardware Stores",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop",
    description: "Bulk inventory, units of measure, and supplier tracking",
  },
  {
    name: "Fashion Stores",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop",
    description: "Sizes, colors, variants, and seasonal collections",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-orange-50 text-orange-600 font-semibold text-sm rounded-full mb-4">
            Industries
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Built for every industry
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            From retail to restaurants, Posify adapts to your business needs with
            industry-specific features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={industry.image}
                  alt={industry.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-bold text-lg">{industry.name}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-slate-500 text-sm leading-relaxed">
                  {industry.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
