import Navbar from "./Navbar";
import Hero from "./Hero";
import HomeWorkflow from "./home/HomeWorkflow";
import SolutionsGrid from "./home/SolutionsGrid";
import MaterialFeatures from "./home/MaterialFeatures";
import ShowcaseGallery from "./home/ShowcaseGallery";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="site-shell font-sans text-gray-900 dark:text-gray-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/60">
      <Navbar />
      <main className="site-main px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-20 md:space-y-28">
        <Hero />
        <HomeWorkflow />
        <SolutionsGrid />
        <MaterialFeatures />
        <ShowcaseGallery />
      </main>
      <Footer />
    </div>
  );
}
