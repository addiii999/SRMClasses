import { useState, useEffect } from 'react';
import { Image } from 'lucide-react';
import api from '../lib/api';

const categories = ['all', 'events', 'results', 'campus', 'activities', 'other'];

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const params = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
    api.get(`/gallery${params}`)
      .then(res => setImages(res.data.data || []))
      .catch(() => setImages([]));
  }, [activeCategory]);

  return (
    <div className="pt-36">
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">Gallery</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">Glimpses of life at SRM Classes — events, results, activities, and more.</p>
        </div>
      </section>

      <section className="section-pad bg-brand-bg">
        <div className="container-pad">
          {/* Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all duration-200 ${
                  activeCategory === cat ? 'bg-gradient-brand text-white shadow-glass' : 'bg-white text-brand-dark hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {images.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Image className="w-10 h-10 text-primary/40" />
              </div>
              <p className="text-gray-400 text-lg">No images yet. Check back soon!</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {images.map((img, i) => (
                <div key={img._id} className="break-inside-avoid card overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                  onClick={() => setLightbox(img)}>
                  <img src={img.imageUrl} alt={img.title} className="w-full object-cover" loading="lazy" />
                  <div className="p-3">
                    <p className="text-sm font-medium text-brand-dark truncate">{img.title}</p>
                    <p className="text-xs text-primary capitalize">{img.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
          onClick={() => setLightbox(null)}
        >
          <div 
            className="max-w-5xl w-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(151,135,243,0.15)] flex flex-col"
            style={{ animation: 'scaleUp 0.3s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-black/95 w-full relative flex items-center justify-center">
              <img src={lightbox.imageUrl} alt={lightbox.title} className="w-full max-h-[75vh] object-contain mx-auto" />
            </div>
            
            <div 
              className="p-4 md:p-5 flex items-center justify-between w-full"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex flex-col gap-1">
                <p style={{ color: '#ffffff', fontWeight: 600 }} className="text-lg md:text-xl tracking-wide uppercase">
                  {lightbox.title}
                </p>
                <p style={{ color: '#9787F3', fontWeight: 500 }} className="text-sm md:text-base capitalize tracking-wider mt-0.5">
                  {lightbox.category}
                </p>
              </div>
              
              <button 
                onClick={() => setLightbox(null)}
                style={{
                  background: 'linear-gradient(135deg, #9787F3, #2D274B)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '15px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(151, 135, 243, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                className="flex items-center justify-center whitespace-nowrap active:scale-95"
              >
                Close ✕
              </button>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{__html:`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}
