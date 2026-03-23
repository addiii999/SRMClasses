import { Link } from 'react-router-dom';
import { GraduationCap, MapPin, Phone, Mail, Instagram, Youtube, Facebook, MessageCircle } from 'lucide-react';

const footerLinks = {
  'Quick Links': [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
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
                { icon: Youtube, href: '#', label: 'YouTube' },
                { icon: Facebook, href: '#', label: 'Facebook' },
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
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <a 
                  href="https://maps.app.goo.gl/TFpjRggpozuA5TDPA" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Srm Classes, Kamre Ashram Rd, Ravi Steel, Tilta, Kamre, Ranchi, Jharkhand 835222
                </a>
              </li>
              <li>
                <a href="tel:+917488886903" className="flex items-center gap-3 text-sm text-white/60 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>+91 7488886903, 9508639773</span>
                </a>
              </li>
              <li>
                <a href="mailto:srmclasses01@gmail.com" className="flex items-center gap-3 text-sm text-white/60 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>srmclasses01@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-pad py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} SRM Classes. All rights reserved.</p>
          <p className="text-white/40 text-sm">Designed with ❤️ for students in Ranchi</p>
        </div>
      </div>
    </footer>
  );
}
