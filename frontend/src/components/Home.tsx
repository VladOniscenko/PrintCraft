import Navbar from "./Navbar";
import Hero from "./Hero";
import ShowcaseGallery from "./home/ShowcaseGallery";
import MaterialFeatures from "./home/MaterialFeatures";
import HomeSteps from "./home/HomeSteps";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="site-shell font-sans text-gray-900 selection:bg-emerald-100">
      <Navbar />
      <main className="site-main px-2 sm:px-4 py-10 space-y-10">
        <Hero />
        <ShowcaseGallery />
        <MaterialFeatures />
        <HomeSteps />
      </main>
      <Footer />
    </div>
  );
}
