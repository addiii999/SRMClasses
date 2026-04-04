import { Link } from 'react-router-dom';
import { Target, Eye, Award, Users, Sparkles, Star } from 'lucide-react';
import { faculty } from '../data/faculty';

const values = [
  { icon: Target, title: 'Our Mission', desc: 'To make quality education accessible to every student in Ranchi, nurturing analytical thinking and a love for learning.' },
  { icon: Eye, title: 'Our Vision', desc: 'To be Ranchi\'s most trusted coaching brand, producing well-rounded students ready for the challenges of tomorrow.' },
  { icon: Award, title: 'Our Values', desc: 'Excellence, integrity, student-first approach, continuous improvement, and a supportive learning environment.' },
];

export default function About() {
  return (
    <div className="pt-36 overflow-x-hidden">
      {/* Hero */}
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5 animate-in fade-in slide-in-from-bottom-4 duration-700">About SRM Classes</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            A decade of transforming young minds. Discover our story, our faculty, and our commitment to academic excellence.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section-pad bg-white">
        <div className="container-pad">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Our Story</div>
              <h2 className="section-title mb-5">10 Years of Academic Excellence</h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                SRM Classes was founded with a simple but powerful idea — every child deserves quality education, guided by passionate teachers who truly care about their growth.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                Starting with just 30 students in a small room, we've grown to a full-fledged coaching institute with over 2,500 students, multiple batches, and a team of expert educators.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Our systematic approach — combining structured curriculum, regular testing, personal mentoring, and comprehensive study material — has consistently produced outstanding board results.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { year: '2014', event: 'SRM Classes founded with 30 students' },
                { year: '2016', event: 'Expanded to Classes 9-12 with science focus' },
                { year: '2019', event: 'Crossed 500 enrolled students milestone' },
                { year: '2022', event: 'Launched digital study material platform' },
                { year: '2024', event: '2,500+ students and 98% success rate' },
              ].map(({ year, event }) => (
                <div key={year} className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glass text-white font-display font-bold text-sm">{year}</div>
                  <div className="pt-2">
                    <p className="text-brand-dark font-medium">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="section-pad bg-brand-bg">
        <div className="container-pad text-center mb-12">
          <h2 className="section-title">Our Core Pillars</h2>
        </div>
        <div className="container-pad">
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-8 text-center bg-white shadow-glass-sm border border-primary/5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-glass">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-brand-dark mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty */}
      <section className="section-pad bg-white overflow-hidden">
        <div className="container-pad text-center mb-4">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Our Team</div>
            <h2 className="section-title">Meet Our Expert Faculty</h2>
            <p className="text-gray-400 text-sm mb-12 font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                The mentors behind our students success
            </p>
        </div>

        <div className="container-pad">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {faculty.map(({ name, subject, exp, initial, rating }, idx) => (
              <div key={name} className="card p-8 text-center animate-fade-in group hover:border-primary/30 transition-all shadow-card hover:shadow-card-hover bg-white border border-gray-100"
                style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="relative w-20 h-20 mx-auto mb-5 translate-y-0 group-hover:-translate-y-1 transition-transform">
                  <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white font-display font-bold text-3xl shadow-glass">
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <span className="text-white text-[10px] font-black uppercase">Pro</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-brand-dark mb-1 h-14 flex items-center justify-center">{name}</h3>
                <p className="text-primary text-xs font-bold mb-1 uppercase tracking-tight">{subject}</p>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-3">{exp}</p>
                
                {/* Rating Display */}
                <div className="flex items-center justify-center gap-1.5 mb-2 py-1.5 bg-brand-bg rounded-lg mt-2">
                   <div className="flex gap-0.5">
                    {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    ))}
                   </div>
                   <span className="text-[11px] font-bold text-brand-dark px-1.5">{rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-brand text-center">
        <div className="container-pad">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to Join Our Family?</h2>
          <p className="text-white/80 mb-8">Start your academic journey with SRM Classes today.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-glass-lg active:scale-95">
            <Users className="w-5 h-5" /> Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
