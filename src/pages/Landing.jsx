import { useState } from "react";
import Hero from "../components/modern-landing/Hero";
import Features from "../components/modern-landing/Features";
import Pricing from "../components/modern-landing/Pricing";
import WebsiteContentSections from "../components/modern-landing/WebsiteContentSections";
import Login from "../components/modern-landing/Login";
import Footer from "../components/modern-landing/Footer";
import DemoModal from "../components/modern-landing/DemoModal";

export default function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="font-sans bg-white text-slate-900 min-h-screen overflow-x-hidden">
      <Hero onOpenDemo={() => setIsModalOpen(true)} />
      <Features />
      <Pricing />
      <WebsiteContentSections />
      <Login />
      <Footer />
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
