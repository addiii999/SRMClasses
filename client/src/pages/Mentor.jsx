import { Link } from 'react-router-dom';
import { Target, MapPin, Award, Users, TrendingUp, BookOpen, Play, ArrowRight } from 'lucide-react';

export default function Mentor() {
  return (
    <div className="pt-36">
      {/* Hero */}
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">Founder & Mentor</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Meet the visionary behind SRM Classes — guiding students from confusion to absolute clarity.
          </p>
        </div>
      </section>

      {/* Meet The Mentor (Founder Section) */}
      <section className="section-pad bg-brand-bg relative overflow-hidden min-h-[70vh]">
        {/* Soft decorative background element */}
        <div className="absolute -left-32 top-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container-pad relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Side: Founder Image */}
            <div className="lg:col-span-5 relative group order-last lg:order-first">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/5] bg-white">
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D274B]/80 via-[#2D274B]/20 to-transparent z-10" />
                <img 
                  src="/images/founder.png" 
                  alt="Ranjan Kumar Soni - Founder of SRM Classes" 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://ui-avatars.com/api/?name=Ranjan+Soni&background=9787F3&color=fff&size=512';
                  }}
                />
                
                {/* Floating Badge over image */}
                <div className="absolute bottom-6 left-6 right-6 z-20 glass-dark rounded-xl p-4 border border-white/20 shadow-glass-lg backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-1">
                    <MapPin className="w-5 h-5 text-primary-300 shrink-0" />
                    <span className="text-white text-sm font-medium">Proudly mentoring students across Ranchi</span>
                  </div>
                  <div className="text-primary-300 text-xs mt-1 italic pl-8">
                    "Confusion se clarity tak ka safar hum dete hain."
                  </div>
                </div>
              </div>
              
              {/* Decorative square dots or pattern behind image */}
              <div className="absolute -z-10 -bottom-6 -right-6 w-32 h-32 bg-[radial-gradient(#9787F3_2px,transparent_2px)] [background-size:16px_16px] opacity-40"></div>
            </div>

            {/* Right Side: Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary/10 text-primary uppercase tracking-wider text-xs font-bold mb-6 shadow-sm">
                <Target className="w-3.5 h-3.5" />
                Meet The Mentor
              </div>
              
              <h2 className="text-3xl md:text-5xl font-display font-bold text-brand-dark leading-tight mb-4">
                "From Confusion to <span className="text-gradient">Clarity</span> — <br className="hidden md:block"/>Guiding Every Student Like His Own"
              </h2>
              
              <div className="mb-6 pb-6 border-b border-primary/10">
                <h3 className="text-xl font-bold text-brand-dark">Ranjan Kumar Soni</h3>
                <p className="text-primary font-medium text-sm">Founder & Lead Educator, SRM Classes</p>
              </div>

              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
                With over a decade of teaching experience, Ranjan Kumar Soni has helped thousands of students turn their academic struggles into consistent success. Known for his simple explanations and personal teaching approach, he believes every student deserves clarity, confidence, and the right direction.
              </p>

              {/* Highlights List */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Award, text: '10+ Years of Teaching Experience (Since 2010)' },
                  { icon: Users, text: '3000+ Students Mentored Successfully' },
                  { icon: TrendingUp, text: '50+ Top Performers Every Year (90%+)' },
                  { icon: Award, text: '5 Years Continuous Best Teacher Award' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-brand-dark/80 text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Teaching Style & Vision Blockquote */}
              <div className="bg-white rounded-2xl p-6 shadow-card border-l-4 border-primary mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-brand opacity-5 blur-2xl rounded-full"></div>
                <p className="text-gray-600 italic text-sm md:text-base leading-relaxed relative z-10 mb-4">
                  "Not just a teacher — more like a mentor who explains concepts like a friend, making even the toughest topics feel simple and clear."
                </p>
                <p className="text-brand-dark font-medium text-sm md:text-base leading-relaxed relative z-10">
                  "Built with a vision to make quality education accessible to every student, SRM Classes focuses on delivering strong concepts, personal attention, and real results — without making education feel complicated or unreachable."
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/contact#demo" className="btn-primary py-4 px-8 text-sm md:text-base flex items-center gap-2 group">
                  <Play className="w-4 h-4 fill-white" />
                  Book Demo with Mentor
                </Link>
                <Link to="/courses" className="btn-outline py-4 px-8 text-sm md:text-base flex items-center gap-2 bg-white">
                  Start Learning Today <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
