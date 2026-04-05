import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, MapPin, Phone, Mail, Instagram, Youtube, Facebook, MessageCircle } from 'lucide-react';
import api from '../lib/api';

const footerLinks = {
  'Quick Links': [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Founder', to: '/mentor' },
    { label: 'Courses', to: '/courses' },
    { label: 'Faculty', to: '/faculty' },
    { label: 'Results', to: '/results' },
  ],
  'Support': [
    { label: 'Contact Us', to: '/contact' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'Student Login', to: '/login' },
    { label: 'Register', to: '/register' },
    { label: 'Book Demo Class', to: '/contact#demo' },
  ],
};

export default function Footer() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get('/branches').then(res => setBranches(res.data?.data || [])).catch(() => {});
  }, []);

  return (
    <footer className="bg-brand-dark text-white">
      <div className="container-pad py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">SRM Classes</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              Premium coaching institute in Ranchi. Expert teaching for Class 5–12 with a proven track record of excellence.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/srm_classes/', label: 'Instagram' },
                { icon: Youtube, href: 'https://youtube.com/@srmclasses-rnc?si=paFOv6nyy3kRbuhB', label: 'YouTube' },
                { icon: Facebook, href: 'https://www.facebook.com/share/1GB8aFs4wo/', label: 'Facebook' },
                { icon: MessageCircle, href: 'https://wa.me/919508639773', label: 'WhatsApp' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}
                      className="text-white/60 hover:text-primary text-sm transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Our Presence</h4>
            <div className="space-y-6">
              {(branches || []).map((branch) => (
                <div key={branch._id} className="space-y-2.5">
                  <p className="text-primary text-[10px] uppercase font-bold tracking-widest">{branch.name}</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3 text-xs text-white/50">
                      <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <a href={branch.googleMapsLink} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        {branch.address}
                      </a>
                    </li>
                    <li className="flex items-center gap-3 text-xs text-white/50">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <a href={`tel:${branch.phone}`} className="hover:text-primary transition-colors">
                        {branch.phone}
                      </a>
                    </li>
                  </ul>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5">
                <a href="mailto:srmclasses01@gmail.com" className="flex items-center gap-3 text-xs text-white/50 hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>srmclasses01@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-pad py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} SRM Classes. All rights reserved.</p>
          <div className="flex items-center gap-4">
             <Link to="/privacy-policy" className="text-white/40 hover:text-primary text-sm font-medium transition-colors hover:underline underline-offset-4">Privacy Policy</Link>
             <p className="text-white/40 text-sm hidden md:block">•</p>
             <p className="text-white/40 text-sm">Designed with ❤️ for students in Ranchi</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
