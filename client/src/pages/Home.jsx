import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnquiryForm from '../components/EnquiryForm';
import { ArrowRight, BookOpen, Users, Trophy, Star, Phone, CheckCircle, Play, ChevronRight, Sparkles, MapPin, Target, Award, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { CONTACT_NUMBERS } from '../config/contact';
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
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'CBSE' },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'CBSE' },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'CBSE' },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'CBSE' },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'CBSE' },
  { name: '11', label: 'Class 11', subjects: 'Commerce – All Subjects', board: 'CBSE & JAC' },
  { name: '12', label: 'Class 12', subjects: 'Commerce – All Subjects', board: 'CBSE & JAC' },
];

const icseClasses = [
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'ICSE', seats: 4 },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'ICSE', seats: 3 },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'ICSE', seats: 6 },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'ICSE', seats: 2 },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'ICSE', seats: 2 },
];

const faqs = [
  { q: "Do you offer free demo classes?", a: "Yes, we offer 2 days of free demo classes for all new students. This allows you to experience our teaching style before enrolling." },
  { q: "What is the average batch size?", a: "To ensure every student gets personalized attention, we keep our batches small, usually limited to 20 students." },
  { q: "Do you provide study material?", a: "Absolutely! We provide comprehensive printed notes, weekly test papers, and extra practice sheets for all subjects." },
  { q: "How do you help students who are weak in certain subjects?", a: "We identify weak areas through regular tests and conduct dedicated doubt-clearing sessions every evening to help them catch up." },
  { q: "Are there regular updates for parents?", a: "Yes, we share weekly performance reports via WhatsApp and conduct monthly PTMs to discuss your child's progress." },
];

const liveAlertNames = ['Ankit', 'Sneha', 'Rahul', 'Priya', 'Vikram', 'Ananya', 'Sayan', 'Isha'];
const liveAlertClasses = ['Class 10', 'Class 12', 'Class 9', 'Class 8'];

export default function Home() {
  const [courseTab, setCourseTab] = useState('CBSE');
  const [activeFaq, setActiveFaq] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get('/branches').then(res => setBranches(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const showRandomAlert = () => {
      const name = liveAlertNames[Math.floor(Math.random() * liveAlertNames.length)];
      const className = liveAlertClasses[Math.floor(Math.random() * liveAlertClasses.length)];
      setCurrentAlert({ name, className });
      
      setTimeout(() => {
        setCurrentAlert(null);
      }, 5000); // Hide after 5 sec
    };

    const interval = setInterval(() => {
      showRandomAlert();
    }, 45000); // Show every 45 sec

    // Initial alert after 10 sec
    const initialTimeout = setTimeout(showRandomAlert, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  // Removed old handleEnquiry logic

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
              Premium coaching for Class 6–12. Small batches, expert faculty, proven results. Join 2,500+ students who trusted SRM Classes.
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
                { value: '7', label: 'Classes (6–12)', color: 'bg-brand-bg' },
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
            <p className="section-subtitle">Comprehensive coaching for Class 6 to 12 with subject-wise expertise</p>
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
              <div key={cls.name + cls.board} className="card p-6 relative overflow-hidden group">
                {/* limited seats badge */}
                {(cls.seats || cls.name === '10' || cls.name === '12') && (
                  <div className="absolute top-3 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-l-lg shadow-lg z-10 animate-pulse">
                    🔥 Last {cls.seats || 3} Seats!
                  </div>
                )}
                
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glass transition-transform group-hover:scale-110">
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

      {/* ── FAQ SECTION ── */}
      <section className="section-pad bg-white">
        <div className="container-pad max-w-4xl">
          <div className="text-center mb-12">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3">Common Doubts</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-primary/10 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-brand-bg transition-colors"
                >
                  <span className="font-semibold text-brand-dark">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-primary transition-transform duration-300 ${activeFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-5 pt-0 text-gray-500 leading-relaxed border-t border-primary/5 bg-brand-bg/30">
                    {faq.a}
                  </div>
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
            <EnquiryForm />
          </div>
        </div>
      </section>

      {/* ── OUR BRANCHES ── */}
      <section className="section-pad bg-brand-bg/50" id="branches">
        <div className="container-pad">
          <div className="text-center mb-12">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-3 text-center">📍 Our Presence</div>
            <h2 className="section-title text-center">Our Coaching Branches</h2>
            <p className="section-subtitle text-center">Visit your nearest SRM Classes centre for a free counselling session.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {branches && branches.length > 0 ? branches.map((branch) => (
              <div key={branch._id} className="card p-8 group hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-6 shadow-glass group-hover:rotate-6 transition-transform">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-brand-dark mb-3">
                  {branch.name}
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-gray-500 text-sm leading-relaxed">{branch.address}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Call Us</p>
                    {CONTACT_NUMBERS.map((number, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary shrink-0" />
                        <a href={`tel:${number}`} className="text-brand-dark font-semibold hover:text-primary transition-colors">
                          {number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <a 
                    href={branch.googleMapsLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> View on Map
                  </a>
                  <Link 
                    to="/contact#demo" 
                    className="flex-1 py-3 text-sm border-2 border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5 flex items-center justify-center gap-2 transition-all"
                  >
                    Book Demo
                  </Link>
                </div>
              </div>
            )) : (
              // Fallback if API fails or loading
              <div className="col-span-2 text-center text-gray-400 py-12">Loading branches...</div>
            )}
          </div>
        </div>
      </section>

      {/* ── DEMO CTA ── */}
      <section className="py-14 bg-gradient-brand">
        <div className="container-pad text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Experience the SRM Difference</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">Attend a free demo class. No commitment required. See why 2,500+ students chose us.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`tel:${CONTACT_NUMBERS[0]}`} className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-glass-lg">
              <Phone className="w-5 h-5" /> Call Now: {CONTACT_NUMBERS[0]}
            </a>
            <Link to="/register" className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all">
              Register for Free Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── GOOGLE MAPS ── */}
      <section className="section-pad bg-white">
        <div className="container-pad">
          <div className="text-center mb-10">
            <h2 className="section-title">Find Us on Google Maps</h2>
            <p className="section-subtitle">Navigate to our centres directly using the maps below</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {(branches || []).map((branch, idx) => (
              <div key={branch._id} className="relative group rounded-3xl overflow-hidden shadow-card-hover border border-primary/10 aspect-[16/10]">
                <iframe
                  title={`SRM Classes - ${branch.name}`}
                  src={idx === 0 
                    ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3661.8452668403957!2d85.26510447478121!3d23.393814302373514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4de05a37f8591%3A0xd9b09379e246fa39!2sSrm%20Classes!5e0!3m2!1sen!2sin!4v1774293801590!5m2!1sen!2sin" 
                    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3659.889708914041!2d85.08004571062635!3d23.46446739942484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4d06f570ae8a3%3A0xfe8ccca9389d906a!2sF37J%2BQVQ%2C%20Mandar%2C%20Jharkhand%20835214!5e0!3m2!1sen!2sin!4v1743856108123!5m2!1sen!2sin"}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex justify-between items-center transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-tighter">Branch Location</p>
                    <p className="font-display font-medium text-brand-dark">{branch.name}</p>
                  </div>
                  <a href={branch.googleMapsLink} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE BOOKING ALERT ── */}
      {currentAlert && (
        <div className="fixed bottom-24 left-4 md:left-8 z-50 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-glass-lg border border-primary/20 flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0">
              {currentAlert.name[0]}
            </div>
            <div>
              <p className="text-sm text-brand-dark font-medium leading-snug">
                <span className="font-bold text-primary">{currentAlert.name}</span> from Ranchi just booked a <span className="text-primary font-bold">Free Demo Class</span> for {currentAlert.className}!
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Verified Booking • Just now</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
