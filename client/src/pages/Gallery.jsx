import { useState, useEffect } from 'react';
import { Image, X } from 'lucide-react';
import api from '../lib/api';
import { cachedFetch } from '../lib/cache';

const categories = ['all', 'events', 'results', 'campus', 'activities', 'other'];

// Utility to optimize Cloudinary URL specifically for Gallery Thumbnails
const optimizeCloudinaryUrl = (url, width = 600, blur = false) => {
  if (!url || !url.includes('/upload/')) return url;
  const transformations = `q_auto,f_auto,w_${width}${blur ? ',e_blur:400' : ''}`;
  return url.replace('/upload/', `/upload/${transformations}/`);
};

// Top Progress Bar Component (YouTube-style)
function TopProgressBar({ isAnimating }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let interval;
    if (isAnimating) {
      setWidth(15); // Initial jump
      interval = setInterval(() => {
        setWidth(prev => (prev < 90 ? prev + (Math.random() * 10) : prev));
      }, 400);
    } else if (width > 0) {
      setWidth(100);
      setTimeout(() => setWidth(0), 400); // Hide after animation finishes
    }
    return () => clearInterval(interval);
  }, [isAnimating]);

  if (width === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[100] pointer-events-none">
      <div 
        className="h-full bg-[#9787F3] shadow-[0_0_10px_#9787F3]" 
        style={{ width: `${width}%`, transition: 'width 0.3s ease-out' }}
      />
    </div>
  );
}

// Advanced Gallery Image Component with Blur-Up & Smooth Loading
function GalleryImage({ image, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const lowResUrl = optimizeCloudinaryUrl(image.imageUrl, 50, true);
  const highResUrl = optimizeCloudinaryUrl(image.imageUrl, 600);

  return (
    <div 
      className="break-inside-avoid relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-glass-lg group mb-4 bg-gray-50"
      onClick={() => onClick(image)}
    >
      {/* Blur Placeholder */}
      <div 
        className={`absolute inset-0 bg-gray-100 flex items-center justify-center transition-opacity duration-700 ease-in-out z-0`}
        style={{ opacity: isLoaded ? 0 : 1 }}
      >
         <img src={lowResUrl} alt="" className="w-full h-full object-cover opacity-60 blur-xl scale-110" aria-hidden="true" />
      </div>

      {/* Main Image */}
      <img 
        src={highResUrl} 
        alt={image.title} 
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`relative z-10 w-full h-auto object-cover transition-opacity duration-[800ms] ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Hover Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <p className="text-sm font-semibold text-white truncate">{image.title}</p>
        <p className="text-xs text-white/80 capitalize font-medium">{image.category}</p>
      </div>
    </div>
  );
}

// Skeleton Loader for API Latency
function GallerySkeleton() {
  // Array of random heights to create a masonry-like skeleton layout
  const heights = [250, 200, 300, 220, 280, 240, 260, 210];
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {heights.map((h, i) => (
        <div 
          key={i} 
          className="break-inside-avoid rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse w-full mb-4" 
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
    const cacheKey = `gallery-${activeCategory}`;

    // Add artificial minimum delay to ensure smooth transition prevents jank
    const minDelay = new Promise(resolve => setTimeout(resolve, 600));
    // cachedFetch: same category tab click hai toh API call nahi hogi (5 min cache)
    const fetchImages = cachedFetch(
      cacheKey,
      () => api.get(`/gallery${params}`).then(res => res.data.data || []),
      5 * 60 * 1000
    ).catch(() => []);

    Promise.all([fetchImages, minDelay]).then(([data]) => {
      setImages(data);
      setIsLoading(false);
    });
  }, [activeCategory]);

  return (
    <div className="pt-36">
      <TopProgressBar isAnimating={isLoading} />

      {/* Hero Section */}
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5 animate-in fade-in slide-in-from-bottom-4 duration-700">Gallery</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">Glimpses of life at SRM Classes — events, results, activities, and more.</p>
        </div>
      </section>

      {/* Gallery Grid Section */}
      <section className="section-pad bg-brand-bg min-h-[60vh]">
        <div className="container-pad">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map(cat => (
              <button key={cat} onClick={() => !isLoading && setActiveCategory(cat)}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-gradient-brand text-white shadow-glass-sm scale-105' 
                    : 'bg-white text-brand-dark border border-gray-100 hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="transition-opacity duration-500">
            {isLoading ? (
              <GallerySkeleton />
            ) : images.length === 0 ? (
              <div className="text-center py-24 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-white shadow-glass-sm flex items-center justify-center mb-6">
                  <Image className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-2">No Images Found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">We're updating our gallery. Check back soon for new photos from our campus!</p>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {images.map((img) => (
                  <GalleryImage key={img._id} image={img} onClick={setLightbox} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Lightbox */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightbox(null)}
        >
          <div 
            className="max-w-5xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#0f0f11] w-full relative flex items-center justify-center p-2">
              <img 
                src={optimizeCloudinaryUrl(lightbox.imageUrl, 1200)} 
                alt={lightbox.title} 
                className="w-full max-h-[75vh] object-contain mx-auto rounded-xl" 
                loading="eager"
              />
            </div>
            
            <div className="p-5 flex items-center justify-between w-full bg-[#1c1c1e] text-white border-t border-white/10">
              <div className="flex flex-col gap-1">
                <p className="text-lg md:text-xl font-bold tracking-wide">
                  {lightbox.title}
                </p>
                <p className="text-sm text-primary font-medium capitalize tracking-wider mt-0.5">
                  {lightbox.category}
                </p>
              </div>
              
              <button 
                onClick={() => setLightbox(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
