import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Johnson",
    business: "Johnson Retail",
    rating: 5,
    text: "Posify transformed our operations. The inventory tracking alone saved us hours every week. Highly recommended for any growing business.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Michael Chen",
    business: "Chen Supermarket",
    rating: 5,
    text: "The multi-branch support is incredible. We manage 5 locations from a single dashboard. The analytics help us make better decisions daily.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Emily Rodriguez",
    business: "Rodriguez Restaurant",
    rating: 5,
    text: "Switching to Posify was the best decision. The offline mode ensures we never miss a sale, even during internet outages.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "David Ochieng",
    business: "Ochieng Pharmacy",
    rating: 5,
    text: "The barcode scanning and expiry tracking features are exactly what we needed. Customer management has never been easier.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Grace Wanjiku",
    business: "Wanjiku Fashion",
    rating: 5,
    text: "Managing variants and seasonal collections is so simple now. The reporting features give us insights we never had before.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "James Kipchoge",
    business: "Kipchoge Electronics",
    rating: 5,
    text: "Professional, reliable, and easy to use. Our staff learned Posify in one day. The support team is fantastic too.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-orange-50 text-orange-600 font-semibold text-sm rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Loved by businesses everywhere
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            See what our customers have to say about how Posify has transformed their operations.
          </p>
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          animate={{ x: [0, -1200, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-6 px-4 sm:px-6 lg:px-8"
          style={{ width: "max-content" }}
        >
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={index}
              className="w-[350px] flex-shrink-0 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-slate-500">{testimonial.business}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{testimonial.text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
