import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Milestone, ThumbsUp, MessageSquareText } from "lucide-react";

const defaultReviews = [
  {
    id: 1,
    name: "Anne Wanjiru",
    role: "Retail Owner",
    text: "PosiFine helped us cut stock losses and finally understand our daily COGS.",
    rating: 5,
    createdAt: "2026-03-21"
  },
  {
    id: 2,
    name: "Sam Kibet",
    role: "Cafe Manager",
    text: "The cashier and admin views stay in sync, and reporting is now clear for our team.",
    rating: 5,
    createdAt: "2026-03-27"
  }
];

export default function WebsiteContentSections() {
  const [reviewForm, setReviewForm] = useState({
    name: "",
    role: "",
    rating: 5,
    text: ""
  });
  const [reviews, setReviews] = useState(defaultReviews);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.text.trim()) return;

    const next = {
      id: Date.now(),
      name: reviewForm.name.trim(),
      role: reviewForm.role.trim() || "POS Customer",
      rating: Number(reviewForm.rating || 5),
      text: reviewForm.text.trim(),
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setReviews((prev) => [next, ...prev]);
    setReviewForm({ name: "", role: "", rating: 5, text: "" });
  };

  return (
    <>
      <section id="advantages" className="py-20 px-6 md:px-12 lg:px-20 bg-[#fefcf8]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#6b4c3b] mb-3">Advantages</h2>
          <p className="text-[#8b5a2b] max-w-3xl mb-10">
            Built for operators who need real numbers, fast decisions, and reliable performance from shop floor to management reports.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "Real-time stock and sale sync between admin and cashier",
              "Accurate COGS, gross profit, and net profit visibility",
              "Multi-role control with secure account and lock features"
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-[#eadbcf] shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <ThumbsUp className="w-5 h-5 text-[#16a34a] mt-1" />
                  <p className="text-[#6b4c3b] font-medium">{item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="py-20 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-[#fff8ef] to-[#f6ece0]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#6b4c3b] mb-8">Roadmap</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              "Q2: Advanced inventory automation and reorder intelligence",
              "Q3: Industry analytics packs and benchmark dashboards",
              "Q4: Expanded API integrations for accounting and payments",
              "Q1: AI-driven staffing and demand planning upgrades"
            ].map((step, index) => (
              <div key={step} className="bg-white rounded-xl p-5 border border-[#e6d5c7]">
                <div className="text-xs font-bold text-[#8b5a2b] mb-2">Milestone {index + 1}</div>
                <div className="flex items-start gap-2">
                  <Milestone className="w-4 h-4 text-[#cd853f] mt-1" />
                  <p className="text-sm text-[#6b4c3b]">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="py-20 px-6 md:px-12 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#6b4c3b] mb-3">Security</h2>
          <p className="text-[#8b5a2b] mb-8 max-w-3xl">
            We secure operations with role-based access, protected sessions, and clear activity trails for accountability.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "Role-based access for main admin, admin, and cashier teams",
              "Screen lock and PIN verification for active cashier stations",
              "Account-level controls with session and activity monitoring"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#eadbcf] p-6 bg-[#fef8f0]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#2563eb] mt-1" />
                  <p className="text-[#6b4c3b]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="company" className="py-20 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-[#f6efe7] to-[#fff9f1]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#6b4c3b] mb-4">About Us</h2>
          <p className="text-lg text-[#6b4c3b] font-semibold mb-3">Mabrixel Tech</p>
          <p className="text-[#8b5a2b] max-w-3xl leading-relaxed">
            Mabrixel Tech builds ecommerce websites, business applications, and security systems for modern companies.
            We combine practical software engineering with dependable operations so your team can run confidently every day.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {["Ecommerce Websites", "Business Apps", "Security Systems"].map((service) => (
              <div key={service} className="bg-white border border-[#eadbcf] rounded-xl p-4 text-[#6b4c3b] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="blogs" className="py-20 px-6 md:px-12 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#6b4c3b] mb-3">Blog & Reviews</h2>
          <p className="text-[#8b5a2b] mb-10">
            Read customer feedback and leave your own review from this section.
          </p>

          <div id="reviews" className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={submitReview} className="bg-[#fef8f0] border border-[#eadbcf] rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#6b4c3b] flex items-center gap-2">
                <MessageSquareText className="w-5 h-5" />
                Leave a Review
              </h3>
              <input
                className="w-full border border-[#eadbcf] rounded-lg px-3 py-2"
                placeholder="Your name"
                value={reviewForm.name}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="w-full border border-[#eadbcf] rounded-lg px-3 py-2"
                placeholder="Your role or business"
                value={reviewForm.role}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, role: e.target.value }))}
              />
              <select
                className="w-full border border-[#eadbcf] rounded-lg px-3 py-2"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
              <textarea
                className="w-full border border-[#eadbcf] rounded-lg px-3 py-2 h-32"
                placeholder="Write your review"
                value={reviewForm.text}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, text: e.target.value }))}
                required
              />
              <button type="submit" className="w-full bg-[#6b4c3b] hover:bg-[#5a4a3b] text-white py-2.5 rounded-lg font-semibold">
                Submit Review
              </button>
            </form>

            <div className="space-y-4">
              <div className="bg-[#f6fbf7] border border-[#d8eddc] rounded-xl p-4 text-sm text-[#2f6a3b]">
                Average rating: <span className="font-bold">{averageRating}</span> / 5 ({reviews.length} reviews)
              </div>
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-[#eadbcf] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-[#6b4c3b]">{review.name}</p>
                    <p className="text-xs text-[#8b5a2b]">{review.createdAt}</p>
                  </div>
                  <p className="text-xs text-[#8b5a2b] mb-2">{review.role}</p>
                  <p className="text-sm text-[#6b4c3b] mb-2">{review.text}</p>
                  <p className="text-xs text-[#cd853f]">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
