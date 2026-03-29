import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Target, Eye, Award, Users, ChevronDown, Sparkles } from 'lucide-react';

const team = [
  { name: 'Mr. Ranjan Kumar Soni', subject: 'Mathematics & Physics', exp: '15 years + experience', initial: 'R' },
  { name: 'Mr. Raghuwendra Kumar Soni', subject: 'Computer & AI', exp: '12 years + experience', initial: 'R' },
  { name: 'Mr. Yuvraj Kumar', subject: 'Chemistry & Physics', exp: '6 years + experience', initial: 'Y' },
  { name: 'Mrs. Priya Pandey', subject: 'Hindi & Sanskrit', exp: '8 Years', initial: 'P' },
  { name: 'Mr. Vikash Gupta', subject: 'Computer Science', exp: '7 Years', initial: 'V' },
  { name: 'Mr. Sunil Mahato', subject: 'Mathematics', exp: '9 Years', initial: 'S' },
];

const values = [
// ... existing entries
];

export default function About() {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleTeam = isExpanded ? team : team.slice(0, 3);

  return (
    <div className="pt-36 overflow-x-hidden">
      {/* Hero */}
      {/* ... Hero section ... */}

      {/* Story */}
      {/* ... Story section ... */}

      {/* Mission / Vision / Values */}
      <section className="section-pad bg-brand-bg">
        <div className="container-pad text-center mb-12">
          <h2 className="section-title">Our Core Pillars</h2>
        </div>
        <div className="container-pad">
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-8 text-center">
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
        <div className="container-pad">
          <div className="text-center mb-12">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Our Team</div>
            <h2 className="section-title">Meet Our Expert Faculty</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {visibleTeam.map(({ name, subject, exp, initial }, idx) => (
              <div key={name} className="card p-8 text-center animate-fade-in group hover:border-primary/30 transition-all shadow-card hover:shadow-card-hover"
                style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="relative w-20 h-20 mx-auto mb-5 translate-y-0 group-hover:-translate-y-1 transition-transform">
                  <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white font-display font-bold text-3xl shadow-glass">
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-brand-dark mb-1">{name}</h3>
                <p className="text-primary text-sm font-semibold mb-1">{subject}</p>
                <p className="text-gray-400 text-xs">{exp}</p>
              </div>
            ))}
          </div>

          {/* Expansion Controller */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 text-sm mb-4 font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Meet the mentors behind your success
            </p>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-brand-dark text-white font-bold transition-all hover:bg-[#1a1631] hover:shadow-[0_0_20px_rgba(151,135,243,0.4)]"
            >
              <span>{isExpanded ? 'Show Less' : 'Explore Full Faculty'}</span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-1'}`} />
              
              {/* Pulsing glow background */}
              {!isExpanded && (
                <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping -z-10 group-hover:opacity-0" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-brand text-center">
        <div className="container-pad">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to Join Our Family?</h2>
          <p className="text-white/80 mb-8">Start your academic journey with SRM Classes today.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-glass-lg">
            <Users className="w-5 h-5" /> Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
