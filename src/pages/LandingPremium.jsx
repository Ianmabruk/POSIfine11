import { useEffect } from "react";
import Navbar from "../components/premium-landing/Navbar";
import Hero from "../components/premium-landing/Hero";
import ParallaxBackground from "../components/premium-landing/ParallaxBackground";
import Features from "../components/premium-landing/Features";
import Benefits from "../components/premium-landing/Benefits";
import HowItWorks from "../components/premium-landing/HowItWorks";
import DashboardPreview from "../components/landing/DashboardPreview";
import Testimonials from "../components/premium-landing/Testimonials";
import PricingPreview from "../components/premium-landing/PricingPreview";
import FAQ from "../components/premium-landing/FAQ";
import FinalCTA from "../components/premium-landing/FinalCTA";
import LandingFooter from "../components/premium-landing/Footer";

export default function LandingPremium() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans bg-white text-slate-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <ParallaxBackground />
        <Features />
        <Benefits />
        <HowItWorks />
        <DashboardPreview />
        <Testimonials />
        <PricingPreview />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
