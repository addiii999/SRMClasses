import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import EnquiryForm from '../components/EnquiryForm';
import { CONTACT_NUMBERS } from '../config/contact';

export default function Contact() {
  const [demoForm, setDemoForm] = useState({ 
    name: '', email: '', mobile: '', confirmMobile: '', studentClass: '', 
    preferredDate: new Date().toISOString().split('T')[0], preferredTime: '', subject: '', branch: ''
  });
  const [captcha, setCaptcha] = useState({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
  const [userCaptcha, setUserCaptcha] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [branches, setBranches] = useState([]);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  
  const { hash } = useLocation();
  const safeExternalUrl = (url) => {
    if (typeof url !== 'string') return null;
    try {
      const parsed = new URL(url);
      return ['https:', 'http:'].includes(parsed.protocol) ? url : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    api.get('/branches').then(res => setBranches(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [hash]);

  // Removed old handleContact logic


  const handleDemo = async (e) => {
    e.preventDefault();
    if (demoForm.mobile !== demoForm.confirmMobile) {
      return toast.error('Mobile numbers do not match!');
    }
    if (Number(userCaptcha) !== captcha.a + captcha.b) {
      setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
      setUserCaptcha('');
      return toast.error('Incorrect math answer. Are you human?');
    }
    setDemoSubmitting(true);
    try {
      await api.post('/demo', demoForm);
      toast.success('Demo class booked! We\'ll confirm your slot.');
      setDemoForm({ name: '', email: '', mobile: '', confirmMobile: '', studentClass: '', preferredDate: new Date().toISOString().split('T')[0], preferredTime: '', subject: '', branch: '' });
      setUserCaptcha('');
      setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.'); 
    }
    finally { setDemoSubmitting(false); }
  };

  return (
    <div className="pt-36">
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">Contact Us</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">Reach out to us via call, WhatsApp, or the form below. We typically respond within 2 hours.</p>
        </div>
      </section>

      <section className="section-pad bg-brand-bg">
        <div className="container-pad">
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
                {/* Call Us Card */}
            <div className="card p-6 flex gap-4 items-start border border-transparent">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-brand-dark mb-1">Call Us</h3>
                <div className="space-y-3 mt-3">
                  {CONTACT_NUMBERS.map((number, idx) => (
                    <div key={idx} className="flex flex-col">
                       <p className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Support Line {idx + 1}</p>
                       <a href={`tel:${number}`} className="text-primary font-bold text-lg hover:underline transition-all tracking-tight">{number}</a>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-xs mt-4">Mon–Sat, 7 AM – 8 PM</p>
              </div>
            </div>

            {/* Visit Us Card */}
            <div className="card p-6 flex gap-4 items-start border border-transparent">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-brand-dark mb-1">Visit Us</h3>
                <div className="space-y-3">
                  {(branches || []).map((b, idx) => (
                    <div key={b._id} className={`p-2 rounded-lg transition-colors cursor-pointer ${activeMapIndex === idx ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50'}`} onClick={() => setActiveMapIndex(idx)}>
                      <p className="text-brand-dark font-bold text-xs">{b.name}</p>
                      <p className="text-gray-500 text-[11px] leading-tight">{b.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Email Card */}
            <a href="mailto:srmclasses01@gmail.com" className="card p-6 flex gap-4 items-start group hover:border-primary/30 border border-transparent">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shadow-glass bg-gradient-hero shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-brand-dark mb-1">Email Us</h3>
                <p className="text-primary font-medium text-sm mb-0.5">srmclasses01@gmail.com</p>
                <p className="text-gray-400 text-xs mb-3">We reply within 24 hours</p>
                <span className="text-primary text-xs font-semibold flex items-center gap-1">Send Email <ArrowRight className="w-3 h-3" /></span>
              </div>
            </a>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <EnquiryForm />

            {/* Demo Form */}
            <form onSubmit={handleDemo} id="demo" className="card p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                <h3 className="font-display font-bold text-xl text-brand-dark">Book a Demo Class</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input className="input-field" placeholder="Enter Full Name" value={demoForm.name} onChange={e => setDemoForm({ ...demoForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input-field" placeholder="your@email.com" value={demoForm.email} onChange={e => setDemoForm({ ...demoForm, email: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Mobile</label>
                  <input className="input-field" placeholder="10-digit number" value={demoForm.mobile} onChange={e => setDemoForm({ ...demoForm, mobile: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Confirm Mobile</label>
                  <input className="input-field" placeholder="Re-enter number" value={demoForm.confirmMobile} onChange={e => setDemoForm({ ...demoForm, confirmMobile: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Preferred Branch</label>
                <select className="input-field" value={demoForm.branch} onChange={e => setDemoForm({ ...demoForm, branch: e.target.value })} required>
                  <option value="">Select Branch</option>
                  {(branches || []).map(b => (
                    <option key={b._id} value={b._id}>{b.name.replace('SRM Classes - ', '')}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Class</label>
                  <select className="input-field" value={demoForm.studentClass} onChange={e => setDemoForm({ ...demoForm, studentClass: e.target.value })} required>
                    <option value="">Select</option>
                    {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <input className="input-field" placeholder="e.g. Mathematics" value={demoForm.subject} onChange={e => setDemoForm({ ...demoForm, subject: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Preferred Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    min={new Date().toISOString().split('T')[0]}
                    value={demoForm.preferredDate} 
                    onChange={e => setDemoForm({ ...demoForm, preferredDate: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">Preferred Time</label>
                  <select className="input-field" value={demoForm.preferredTime} onChange={e => setDemoForm({ ...demoForm, preferredTime: e.target.value })}>
                    <option value="">Select time</option>
                    {['7:00 AM', '8:30 AM', '10:00 AM', '4:00 PM', '5:30 PM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label text-gray-500">Human Verification: {captcha.a} + {captcha.b} = ?</label>
                <input 
                  type="number" 
                  className="input-field font-semibold text-center" 
                  placeholder="Answer" 
                  value={userCaptcha} 
                  onChange={e => setUserCaptcha(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" disabled={demoSubmitting} className="btn-primary w-full py-4 disabled:opacity-60">
                {demoSubmitting ? 'Booking...' : '🎓 Book Free Demo Class'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="map" className="relative group overflow-hidden border-t border-primary/10">
        <div className="h-[500px] bg-gray-100 relative">
          {branches[activeMapIndex] && (
            <iframe
              title={`SRM Classes - ${branches[activeMapIndex].name}`}
              className="absolute inset-0 w-full h-full"
              src={activeMapIndex === 0
                ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3661.8452668403957!2d85.26510447478121!3d23.393814302373514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4de05a37f8591%3A0xd9b09379e246fa39!2sSrm%20Classes!5e0!3m2!1sen!2sin!4v1774293801590!5m2!1sen!2sin"
                : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3659.889708914041!2d85.08004571062635!3d23.46446739942484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4d06f570ae8a3%3A0xfe8ccca9389d906a!2sF37J%2BQVQ%2C%20Mandar%2C%20Jharkhand%20835214!5e0!3m2!1sen!2sin!4v1743856108123!5m2!1sen!2sin"}
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          
          {/* Branch Switching Overlay */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {(branches || []).map((b, idx) => (
              <button 
                key={b._id}
                onClick={() => setActiveMapIndex(idx)}
                className={`px-4 py-2 rounded-full text-xs font-bold shadow-xl transition-all ${activeMapIndex === idx ? 'bg-primary text-white scale-105' : 'bg-white/90 text-brand-dark backdrop-blur-md hover:bg-white'}`}
              >
                {b.name.split('-')[1] || b.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Floating Map Button for Mobile/Multi-device Compatibility */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="bg-black/20 backdrop-blur-sm inset-0 absolute" />
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          {branches[activeMapIndex] && safeExternalUrl(branches[activeMapIndex].googleMapsLink) && (
            <a 
              href={safeExternalUrl(branches[activeMapIndex].googleMapsLink)}
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white text-brand-dark font-bold rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"
            >
              <MapPin className="w-5 h-5 text-primary group-hover:text-white" />
              Open {branches[activeMapIndex].name} on Maps
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
