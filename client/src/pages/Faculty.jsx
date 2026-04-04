import { Star, Sparkles } from 'lucide-react';
import { faculty } from '../data/faculty';

export default function Faculty() {
  return (
    <div className="pt-36">
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse duration-1000" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5 animate-in fade-in slide-in-from-bottom-4 duration-700">Meet Our Experts</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">The dedicated educators who have helped thousands of students achieve their academic goals in Ranchi.</p>
        </div>
      </section>

      <section className="section-pad bg-brand-bg min-h-screen">
        <div className="container-pad">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {faculty.map(({ name, subject, exp, qual, initial, speciality, rating }, idx) => (
              <div key={idx} className="card p-8 text-center animate-fade-in group hover:border-primary/30 transition-all shadow-card hover:shadow-card-hover bg-white"
                style={{ animationDelay: `${idx * 0.05}s` }}>
                
                <div className="relative w-20 h-20 mx-auto mb-6 translate-y-0 group-hover:-translate-y-1 transition-transform">
                  <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white font-display font-bold text-3xl shadow-glass border-4 border-white">
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                     <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg text-brand-dark mb-1 h-12 flex items-center justify-center leading-tight">
                  {name}
                </h3>
                <p className="text-primary text-xs font-bold mb-2 uppercase tracking-tight">{subject}</p>
                <p className="text-gray-400 text-[11px] font-medium leading-relaxed mb-4 italic">"{speciality}"</p>
                
                {/* Qualification Badge */}
                <div className="inline-block px-3 py-1 bg-primary/5 rounded-lg border border-primary/10 mb-4">
                  <p className="text-primary text-[10px] font-bold uppercase tracking-wider">{qual}</p>
                </div>

                {/* Rating & Exp Section */}
                <div className="mt-auto border-t border-gray-50 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-2">
                     <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        ))}
                     </div>
                     <span className="text-xs font-black text-brand-dark">{rating}</span>
                  </div>
                  
                  <div className="bg-brand-bg rounded-full py-1.5 px-4 inline-block mx-auto">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{exp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
