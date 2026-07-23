import { motion } from "framer-motion";

export default function ProductShowcase() {
  return (
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto max-w-lg lg:max-w-xl"
    >
      <div className="glass-card-premium rounded-[1.5rem] p-6 sm:p-8 shadow-2xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-brand-500 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/25">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-bold text-white">Posify POS</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <div className="w-3 h-3 bg-white/20 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {["Sales", "Products", "Customers"].map((item, i) => (
            <div
              key={item}
              className={`rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-white/5 ${
                i === 0
                  ? "bg-primary-500/10"
                  : i === 1
                  ? "bg-orange-500/10"
                  : "bg-blue-500/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${
                  i === 0
                    ? "bg-primary-500/20 text-primary-400"
                    : i === 1
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-blue-500/20 text-blue-400"
                } flex items-center justify-center`}
              >
                <span className="text-xs font-bold">{item[0]}</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">{item}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          <div className="w-full h-2 bg-white/5 rounded-full" />
          <div className="w-4/5 h-2 bg-white/5 rounded-full" />
          <div className="w-3/5 h-2 bg-white/5 rounded-full" />
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-white mb-6 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total</span>
            <span className="font-bold text-lg text-white">KES 2,450</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
            <p className="text-[10px] text-slate-400">Items</p>
            <p className="font-bold text-white text-sm">3</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
            <p className="text-[10px] text-slate-400">Qty</p>
            <p className="font-bold text-white text-sm">5</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
