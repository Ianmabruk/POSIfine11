import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import ParallaxBackground from "../components/landing/ParallaxBackground";
import Features from "../components/landing/Features";
import Industries from "../components/landing/Industries";
import DashboardPreview from "../components/landing/DashboardPreview";
import Testimonials from "../components/landing/Testimonials";
import Pricing from "../components/landing/Pricing";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

export default function LandingSaaS() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans bg-cream-50 text-slate-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Industries />
        <DashboardPreview />
        <Testimonials />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
