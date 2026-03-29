import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', studentClass: '', message: '' });
  const [demoForm, setDemoForm] = useState({ name: '', email: '', mobile: '', studentClass: '', preferredDate: '', preferredTime: '', subject: '' });
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  
  const { hash } = useLocation();

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

  const handleContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/enquiries', form);
      toast.success('Message sent! We\'ll get back to you shortly.');
      setForm({ name: '', email: '', mobile: '', studentClass: '', message: '' });
    } catch { toast.error('Failed to send. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const handleDemo = async (e) => {
    e.preventDefault();
    setDemoSubmitting(true);
    try {
      await api.post('/demo', demoForm);
      toast.success('Demo class booked! We\'ll confirm your slot.');
      setDemoForm({ name: '', email: '', mobile: '', studentClass: '', preferredDate: '', preferredTime: '', subject: '' });
    } catch { toast.error('Booking failed. Please try again.'); }
    finally { setDemoSubmitting(false); }
  };

  return (
    <div className="pt-28">
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
            {/* Info Cards */}
            {[
              { icon: Phone, title: 'Call Us', info: '+91 7488886903, 9508639773', sub: 'Mon–Sat, 7 AM – 8 PM', href: 'tel:+917488886903', cta: 'Call Now' },
              { icon: Mail, title: 'Email Us', info: 'srmclasses01@gmail.com', sub: 'We reply within 24 hours', href: 'mailto:srmclasses01@gmail.com', cta: 'Send Email' },
              { icon: MapPin, title: 'Visit Us', info: 'Kamre, Ranchi, Jharkhand', sub: 'SRM Classes, Ashram Rd', href: 'https://maps.app.goo.gl/TFpjRggpozuA5TDPA', cta: 'Open in Maps' },
            ].map(({ icon: Icon, title, info, sub, href, cta }) => (
              <a key={title} href={href} className="card p-6 flex gap-4 items-start group hover:border-primary/30 border border-transparent">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-brand-dark mb-1">{title}</h3>
                  <p className="text-primary font-medium text-sm mb-0.5">{info}</p>
                  <p className="text-gray-400 text-xs mb-3">{sub}</p>
                  <span className="text-primary text-xs font-semibold flex items-center gap-1">{cta} <ArrowRight className="w-3 h-3" /></span>
                </div>
              </a>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <form onSubmit={handleContact} className="card p-8 space-y-4">
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Send a Message</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input className="input-field" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Mobile</label>
                  <input className="input-field" placeholder="10-digit" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Class</label>
                <select className="input-field" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })}>
                  <option value="">Select Class</option>
                  {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input-field resize-none" rows={4} placeholder="How can we help you?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-4 disabled:opacity-60">
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            {/* Demo Form */}
            <form onSubmit={handleDemo} id="demo" className="card p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                <h3 className="font-display font-bold text-xl text-brand-dark">Book a Demo Class</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input className="input-field" placeholder="Full name" value={demoForm.name} onChange={e => setDemoForm({ ...demoForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Mobile</label>
                  <input className="input-field" placeholder="10-digit" value={demoForm.mobile} onChange={e => setDemoForm({ ...demoForm, mobile: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="your@email.com" value={demoForm.email} onChange={e => setDemoForm({ ...demoForm, email: e.target.value })} required />
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
                  <input type="date" className="input-field" value={demoForm.preferredDate} onChange={e => setDemoForm({ ...demoForm, preferredDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">Preferred Time</label>
                  <select className="input-field" value={demoForm.preferredTime} onChange={e => setDemoForm({ ...demoForm, preferredTime: e.target.value })}>
                    <option value="">Select time</option>
                    {['7:00 AM', '8:30 AM', '10:00 AM', '4:00 PM', '5:30 PM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={demoSubmitting} className="btn-primary w-full py-4 disabled:opacity-60">
                {demoSubmitting ? 'Booking...' : '🎓 Book Free Demo Class'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="relative group overflow-hidden">
        <div className="h-[450px] bg-gray-100">
          <iframe
            title="SRM Classes - Ranchi Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3661.8452668403957!2d85.26510447478121!3d23.393814302373514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4de05a37f8591%3A0xd9b09379e246fa39!2sSrm%20Classes!5e0!3m2!1sen!2sin!4v1774293801590!5m2!1sen!2sin"
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        
        {/* Floating Map Button for Mobile/Multi-device Compatibility */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="bg-black/20 backdrop-blur-sm inset-0 absolute" />
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <a 
            href="https://maps.app.goo.gl/TFpjRggpozuA5TDPA" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-white text-brand-dark font-bold rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"
          >
            <MapPin className="w-5 h-5 text-primary group-hover:text-white" />
            Open in Google Maps
          </a>
        </div>
      </section>
    </div>
  );
}
