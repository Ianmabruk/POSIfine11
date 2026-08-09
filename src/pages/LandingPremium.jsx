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
import SEO from "../components/SEO";

const landingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Posify",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "Modern POS platform for African businesses. Manage sales, inventory, staff, and analytics.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Starter",
      "price": "999",
      "priceCurrency": "KES",
      "billingIncrement": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Professional",
      "price": "2499",
      "priceCurrency": "KES",
      "billingIncrement": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Enterprise",
      "price": "4999",
      "priceCurrency": "KES",
      "billingIncrement": "P1M"
    }
  ]
};

export default function LandingPremium() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans bg-cream-50 text-slate-900 antialiased safe-top overflow-x-hidden">
      <SEO
        title="POSIFY - Enterprise POS Platform for African Businesses"
        description="Modern POS platform for African businesses. Manage sales, inventory, staff, and analytics in one system. 15-day free trial. M-PESA integration."
        canonical="https://posifine22.onrender.com/"
        jsonLd={landingJsonLd}
      />
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
