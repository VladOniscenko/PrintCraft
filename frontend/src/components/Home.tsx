import Navbar from "./Navbar";
import Hero from "./Hero";
import SolutionsGrid from "./home/SolutionsGrid";
import ShowcaseGallery from "./home/ShowcaseGallery";
import MaterialFeatures from "./home/MaterialFeatures";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="site-shell font-sans text-gray-900 selection:bg-emerald-100">
      <Navbar />
      <main className="site-main px-2 sm:px-4 py-10 space-y-12">
        <Hero />
        <SolutionsGrid />
        <ShowcaseGallery />
        <MaterialFeatures />
      </main>
      <Footer />
    </div>
  );
}
