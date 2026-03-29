import { Link } from 'react-router-dom';
import { CheckCircle, Target, Eye, Award, Users, MapPin, Play, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';

const team = [
  { name: 'Mr. Rajesh Kumar', subject: 'Mathematics & Physics', exp: '15 Years Experience', initial: 'R' },
  { name: 'Mrs. Sunita Devi', subject: 'Chemistry & Biology', exp: '12 Years Experience', initial: 'S' },
  { name: 'Mr. Amit Singh', subject: 'English & Social Science', exp: '10 Years Experience', initial: 'A' },
];

const values = [
  { icon: Target, title: 'Our Mission', desc: 'To make quality education accessible to every student in Ranchi, nurturing analytical thinking and a love for learning.' },
  { icon: Eye, title: 'Our Vision', desc: 'To be Ranchi\'s most trusted coaching brand, producing well-rounded students ready for the challenges of tomorrow.' },
  { icon: Award, title: 'Our Values', desc: 'Excellence, integrity, student-first approach, continuous improvement, and a supportive learning environment.' },
];

export default function About() {
  return (
    <div className="pt-28 overflow-x-hidden">
      {/* Hero */}
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">About SRM Classes</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            A decade of transforming young minds. Discover our story, our faculty, and our commitment to academic excellence.
          </p>
        </div>
      </section>

      {/* Meet The Mentor (Founder Section) */}
      <section className="section-pad bg-brand-bg relative overflow-hidden">
        {/* Soft decorative background element */}
        <div className="absolute -left-32 top-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container-pad relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Side: Founder Image */}
            <div className="lg:col-span-5 relative group order-last lg:order-first">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/5] bg-white">
                {/* Image Placeholder - User will replace this or upload /images/founder.jpg */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D274B]/80 via-[#2D274B]/20 to-transparent z-10" />
                <img 
                  src="/images/founder.png" 
                  alt="Ranjan Kumar Soni - Founder of SRM Classes" 
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
                  { icon: BookOpen, text: 'PGT Level Educator & Teacher Trainer' },
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
              <div className="flex flex-wrap gap-4">
                <Link to="/contact#demo" className="btn-primary py-4 px-8 text-sm md:text-base flex items-center gap-2 group">
                  <Play className="w-4 h-4 fill-white" />
                  Book Demo with Mentor
                </Link>
                <Link to="/courses" className="btn-outline py-4 px-8 text-sm md:text-base flex items-center gap-2">
                  Start Learning Today <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
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
        <div className="container-pad">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Core Pillars</h2>
          </div>
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
      <section className="section-pad bg-white">
        <div className="container-pad">
          <div className="text-center mb-12">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Our Team</div>
            <h2 className="section-title">Meet Our Expert Faculty</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map(({ name, subject, exp, initial }) => (
              <div key={name} className="card p-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-brand flex items-center justify-center text-white font-display font-bold text-3xl mb-4 shadow-glass">
                  {initial}
                </div>
                <h3 className="font-display font-bold text-xl text-brand-dark mb-1">{name}</h3>
                <p className="text-primary text-sm font-medium mb-1">{subject}</p>
                <p className="text-gray-400 text-xs">{exp}</p>
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
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-glass-lg">
            <Users className="w-5 h-5" /> Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
