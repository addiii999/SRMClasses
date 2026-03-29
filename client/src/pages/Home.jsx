import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Trophy, Star, Phone, CheckCircle, Play, ChevronRight, Sparkles, MapPin, Target, Award, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const stats = [
  { label: 'Students Enrolled', value: '2,500+', icon: Users },
  { label: 'Years of Excellence', value: '10+', icon: Trophy },
  { label: 'Courses Offered', value: '8', icon: BookOpen },
  { label: 'Success Rate', value: '98%', icon: Star },
];

const whyUs = [
  { title: 'Expert Faculty', desc: 'Experienced teachers with 10+ years of coaching expertise.' },
  { title: 'Small Batch Size', desc: 'Personalized attention with a maximum of 20 students per batch.' },
  { title: 'Study Material', desc: 'Comprehensive notes, test papers, and digital resources.' },
  { title: 'Regular Tests', desc: 'Weekly assessments to track progress and identify gaps.' },
  { title: 'Doubt Sessions', desc: 'Dedicated doubt-clearing sessions every evening.' },
  { title: 'Result Oriented', desc: '98% of our students score above 85% in board exams.' },
];

const testimonials = [
  { name: 'Priya Sharma', class: 'Class 12 – CBSE 2024', text: 'SRM Classes transformed my preparation. I scored 95% in boards thanks to their structured approach and dedicated faculty!', rating: 5 },
  { name: 'Rahul Kumar', class: 'Class 10 – CBSE 2024', text: 'The best coaching I ever attended. Small batches, personal attention, and amazing study material. Highly recommended!', rating: 5 },
  { name: 'Ananya Singh', class: 'Class 12 – JEE 2024', text: 'I qualified JEE with AIR 4200 after joining SRM Classes in Class 11. The faculty is truly exceptional.', rating: 5 },
];

const cbseClasses = [
  { name: '5', label: 'Class 5', subjects: 'All Subjects', board: 'CBSE' },
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'CBSE' },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'CBSE' },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'CBSE' },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'CBSE' },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'CBSE' },
  { name: '11', label: 'Class 11', subjects: 'Commerce – All Subjects', board: 'CBSE & JAC' },
  { name: '12', label: 'Class 12', subjects: 'Commerce – All Subjects', board: 'CBSE & JAC' },
];

const icseClasses = [
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'ICSE' },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'ICSE' },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'ICSE' },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'ICSE' },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'ICSE' },
];

export default function Home() {
  const [courseTab, setCourseTab] = useState('CBSE');
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', mobile: '', studentClass: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleEnquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/enquiries', enquiryForm);
      toast.success('Enquiry submitted! We will contact you shortly.');
      setEnquiryForm({ name: '', email: '', mobile: '', studentClass: '', message: '' });
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center bg-gradient-hero overflow-hidden pt-40 pb-40">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="container-pad relative z-10 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary-300" />
              Ranchi's Most Trusted Coaching Institute
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6 animate-slide-up">
              Best Coaching{' '}
              <span className="relative inline-block mt-2 sm:mt-0">
                <span className="text-primary-300 z-10 relative">Institute</span>
                <svg className="absolute -bottom-2 left-0 w-full z-0" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10 Q150 2 298 10" stroke="#9787F3" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              {' '}in Ranchi – SRM Classes
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed animate-fade-in">
              Premium coaching for Class 5–12. Small batches, expert faculty, proven results. Join 2,500+ students who trusted SRM Classes.
            </p>
            <div className="flex flex-wrap gap-4 mb-4 animate-fade-in">
              <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/contact#demo" className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 border-solid transition-all duration-200">
                <Play className="w-5 h-5" /> Book Demo Class
              </Link>
            </div>
            {/* Quick trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10">
              {['Free Demo Class', 'Expert Faculty', '98% Success Rate'].map(badge => (
                <div key={badge} className="flex items-center gap-2 text-white/90 text-sm md:text-base font-medium">
                  <CheckCircle className="w-5 h-5 text-green-400" /> {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 w-full bg-white/10 backdrop-blur-md border-t border-white/10">
          <div className="container-pad py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-bold text-xl">{value}</div>
                  <div className="text-white/60 text-xs">{label}</div>
                </div>
              </div>
            ))}
          </div>
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

      {/* ── ABOUT PREVIEW ── */}
      <section className="section-pad bg-white">
        <div className="container-pad">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">About SRM Classes</div>
              <h2 className="section-title mb-5">A Legacy of Academic Excellence</h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                Founded with a vision to provide quality education at affordable costs, SRM Classes has been shaping young minds in Ranchi for over a decade. Our expert faculty combines deep subject knowledge with innovative teaching methods.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                We believe every student has potential — our job is to unlock it. With personalized attention, rigorous practice, and a supportive environment, we've helped thousands of students achieve their academic dreams.
              </p>
              <Link to="/about" className="btn-primary inline-flex items-center gap-2">
                Know More About Us <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '2,500+', label: 'Students', color: 'bg-gradient-brand' },
                { value: '10+', label: 'Years', color: 'bg-brand-dark' },
                { value: '98%', label: 'Success Rate', color: 'bg-primary/10' },
                { value: '8', label: 'Classes (5–12)', color: 'bg-brand-bg' },
              ].map(({ value, label, color }) => (
                <div key={label} className={`${color} rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-card`}>
                  <div className={`text-3xl font-display font-bold mb-1 ${color.includes('gradient') || color.includes('dark') ? 'text-white' : 'text-brand-dark'}`}>{value}</div>
                  <div className={`text-sm font-medium ${color.includes('gradient') || color.includes('dark') ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COURSES PREVIEW ── */}
      <section className="section-pad bg-brand-bg">
        <div className="container-pad">
          <div className="text-center mb-12">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Our Programs</div>
            <h2 className="section-title">Courses We Offer</h2>
            <p className="section-subtitle">Comprehensive coaching for Class 5 to 12 with subject-wise expertise</p>
          </div>
          {/* Board Filter Tabs */}
          <div className="flex justify-center gap-4 mb-10">
            {['CBSE', 'ICSE'].map(tab => (
              <button
                key={tab}
                onClick={() => setCourseTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  courseTab === tab
                    ? 'bg-gradient-brand text-white shadow-glass'
                    : 'bg-white text-brand-dark border border-primary/20 hover:border-primary/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(courseTab === 'CBSE' ? cbseClasses : icseClasses).map((cls) => (
              <div key={cls.name + cls.board} className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glass">
                  <span className="text-white font-display font-bold text-lg">{cls.name}</span>
                </div>
                <h3 className="font-display font-bold text-brand-dark text-lg mb-2">
                  {cls.label}
                </h3>
                <p className="text-gray-500 text-sm mb-3">{cls.subjects}</p>
                <p className="text-xs text-primary font-semibold">Board: {cls.board}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/courses" className="btn-outline inline-flex items-center gap-2">
              View All Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="section-pad bg-white">
        <div className="container-pad">
          <div className="text-center mb-12">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Why SRM Classes</div>
            <h2 className="section-title">What Sets Us Apart</h2>
            <p className="section-subtitle">We don't just teach — we mentor, motivate, and transform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map(({ title, desc }) => (
              <div key={title} className="card-glass flex gap-4 p-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glass">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-1">{title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section-pad bg-gradient-hero">
        <div className="container-pad">
          <div className="text-center mb-12">
            <div className="text-primary-300 font-semibold text-sm tracking-wider uppercase mb-3">Student Stories</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">What Our Students Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, class: cls, text, rating }) => (
              <div key={name} className="glass-dark rounded-2xl p-6 border border-white/10">
                <div className="flex gap-0.5 mb-4">
                  {Array(rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5">"{text}"</p>
                <div>
                  <div className="font-semibold text-white">{name}</div>
                  <div className="text-primary-300 text-xs">{cls}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENQUIRY FORM ── */}
      <section className="section-pad bg-brand-bg" id="enquiry">
        <div className="container-pad">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Get in Touch</div>
              <h2 className="section-title mb-4">Start Your Journey Today</h2>
              <p className="text-gray-500 mb-6">Fill in your details and our counsellor will reach out within 24 hours.</p>
              <ul className="space-y-3">
                {['Free counselling session', 'Course recommendation', 'Fee & batch details', 'Demo class invitation'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <form onSubmit={handleEnquiry} className="card p-8 space-y-4">
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Send Enquiry</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input-field" placeholder="Your name" value={enquiryForm.name}
                    onChange={e => setEnquiryForm({ ...enquiryForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Mobile</label>
                  <input className="input-field" placeholder="10-digit number" value={enquiryForm.mobile}
                    onChange={e => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="your@email.com" value={enquiryForm.email}
                  onChange={e => setEnquiryForm({ ...enquiryForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Class Interested In</label>
                <select className="input-field" value={enquiryForm.studentClass}
                  onChange={e => setEnquiryForm({ ...enquiryForm, studentClass: e.target.value })}>
                  <option value="">Select Class</option>
                  {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Message (optional)</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Any specific queries..." value={enquiryForm.message}
                  onChange={e => setEnquiryForm({ ...enquiryForm, message: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? 'Submitting...' : <><span>Submit Enquiry</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── DEMO CTA ── */}
      <section className="py-14 bg-gradient-brand">
        <div className="container-pad text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Experience the SRM Difference</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">Attend a free demo class. No commitment required. See why 2,500+ students chose us.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+917488886903" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-glass-lg">
              <Phone className="w-5 h-5" /> Call Now: +91 7488886903
            </a>
            <Link to="/register" className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all">
              Register for Free Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── GOOGLE MAP ── */}
      <section className="section-pad bg-white">
        <div className="container-pad">
          <div className="text-center mb-10">
            <h2 className="section-title">Find Us in Ranchi</h2>
            <p className="section-subtitle">Visit us at our coaching centre or reach out online</p>
          </div>
          <div className="relative group rounded-2xl overflow-hidden shadow-card-hover border border-primary/10 aspect-video">
            <iframe
              title="SRM Classes Location - Ranchi"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3661.8452668403957!2d85.26510447478121!3d23.393814302373514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4de05a37f8591%3A0xd9b09379e246fa39!2sSrm%20Classes!5e0!3m2!1sen!2sin!4v1774293801590!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Floating Map Button for Mobile/Multi-device Compatibility */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <a
                href="https://maps.app.goo.gl/TFpjRggpozuA5TDPA"
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-white text-brand-dark font-bold rounded-full shadow-glass-lg hover:scale-105 transition-all"
              >
                <MapPin className="w-5 h-5 text-primary" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
