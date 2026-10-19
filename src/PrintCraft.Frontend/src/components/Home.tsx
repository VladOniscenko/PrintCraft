import Navbar from "./Navbar";
import Hero from "./Hero";
import MarketAudiences from "./home/MarketAudiences";
import SolutionsGrid from "./home/SolutionsGrid";
import ShowcaseGallery from "./home/ShowcaseGallery";
import MaterialFeatures from "./home/MaterialFeatures";
import HomeWorkflow from "./home/HomeWorkflow";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="site-shell font-sans text-gray-900 selection:bg-emerald-100">
      <Navbar />
      <main className="site-main px-2 sm:px-4 py-10 space-y-12">
        <Hero />
        <MarketAudiences />
        <SolutionsGrid />
        <ShowcaseGallery />
        <MaterialFeatures />
        <HomeWorkflow />
      </main>
      <Footer />
    </div>
  );
}
