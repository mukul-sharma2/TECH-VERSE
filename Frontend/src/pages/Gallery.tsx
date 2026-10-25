import { useEffect, useState } from "react";
import Category_navbar from "@/components/category_navbar";
import { Card } from "@/components/ui/card";
import { getGallery } from "@/services/api";

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  useEffect(() => {
    getGallery()
      .then((data) => setGalleryItems(data))
      .catch((error) => console.error("Error fetching gallery items:", error));
  }, []);

  useEffect(() => {
    galleryItems.slice(0, 4).forEach(item => {
      const img = new Image();
      img.src = item.img_url;
    });
  }, [galleryItems]);
  
  return (
    <div className="min-h-screen pt-10">
      {/* Hero Section */}
      
<section className="relative pt-16 pb-6 md:py-20 bg-gradient-to-br from-[#252D6F] to-[#4676E6] text-white overflow-hidden">

  {/* Animated floating shapes */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-10 left-10 w-8 h-8 bg-[#4676E6]/70 rounded-full animate-bounce-slow blur-md"></div>

    <div className="absolute top-16 right-10 w-5 h-5 bg-[#FFD54F]/80 rounded-full animate-pulse blur-md"></div>

    <div className="absolute bottom-6 left-1/4 w-14 h-14 border-4 border-white/30 rounded-full animate-spin-slow"></div>

    <div className="absolute top-1/2 right-20 w-12 h-6 bg-[#B16FFF]/70 rounded-3xl animate-bounce-x blur-md"></div>

    <div className="absolute top-8 right-2 w-4 h-4 bg-[#F56060]/80 rounded-full animate-bounce"></div>

    <div className="absolute bottom-4 left-6 w-4 h-4 bg-[#36C2A3]/70 rounded-full animate-bounce"></div>
  </div>

  {/* Centered content */}
  <div className="container mx-auto px-4 text-center relative z-10">

    <span className="inline-block px-4 py-2 bg-white/10 rounded-full text-xs md:text-sm font-medium backdrop-blur-md border border-white/20 shadow-sm mb-3 tracking-widest animate-fade-in">
      Highlights
    </span>

    <h1 className="text-4xl md:text-5xl font-extrabold pb-2 mb-4 animate-fade-in-up bg-gradient-to-r from-[#FFD54F] via-white to-[#4676E6] bg-clip-text text-transparent drop-shadow-xl">
      Event Gallery
    </h1>

    <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto animate-fade-in leading-relaxed">
      Relive the{" "}
      <span className="font-semibold text-[#FFD54F]">
        excitement and innovation{" "}
      </span>
      of our previous{" "}
      <span className="font-semibold text-[#d746ff]">
        Events
      </span>{" "}
      through our highlights.
    </p>

  </div>
</section>


      {/* Gallery Grid */}
      <section className="py-20 bg-gradient-to-b from-blue-50 via-blue-100 to-gray-200 justify-center items-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-snug mb-6 justify-center text-center mx-auto items-center">
            Past Events
          </h2>
          <Category_navbar galleryItems={galleryItems} />
        </div>
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-snug mb-6 justify-center text-center mx-auto items-center">
            Upcoming Events
          </h2>
          <Card className="p-8 w-[80vw] max-w-2xl border-primary/20 flex justify-center items-center content-center mx-auto">
            <p className="text-gray-500 text-md md:text-xl font-medium">
              Events will be announced soon! 🚀
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
