import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, GraduationCap, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { CONTACT_NUMBERS } from '../config/contact';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Founder', to: '/mentor' },
  { label: 'Courses', to: '/courses' },
  { label: 'Fee Calculator', to: '/fee-calculator' },
  { label: 'Faculty', to: '/faculty' },
  { label: 'Results', to: '/results' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHome = location.pathname === '/';
  const isLightText = isHome && !scrolled;
  const navbarBg = scrolled ? 'bg-white/90 backdrop-blur-xl shadow-card border-b border-primary/10' : (isHome ? 'bg-transparent' : 'bg-white shadow-sm border-b border-primary/5');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className="bg-[#2D274B] text-white py-2 px-4 text-xs md:text-sm shadow-sm border-b border-white/5">
        <div className="container-pad flex flex-col md:flex-row justify-between items-center gap-1.5 md:gap-4 font-medium uppercase tracking-wider">
          <div className="flex items-center gap-2 opacity-90 text-[10px] md:text-xs">
            Call Now for Admission
          </div>
          <div className="flex items-center gap-4 text-sm">
             <a href={`tel:${CONTACT_NUMBERS[0]}`} className="hover:text-primary-300 transition-colors">{CONTACT_NUMBERS[0]}</a>
             <span className="opacity-20 hidden md:inline">|</span>
             <a href={`tel:${CONTACT_NUMBERS[1]}`} className="hover:text-primary-300 transition-colors">{CONTACT_NUMBERS[1]}</a>
          </div>
        </div>
      </div>

      {/* Announcement Bar (Scrolling Ticker) */}
      <div className="bg-primary/95 text-white py-1.5 overflow-hidden border-b border-white/10 shadow-sm relative z-40">
        <div className="whitespace-nowrap animate-marquee font-medium text-[10px] md:text-sm tracking-wide uppercase">
          <span className="mx-8">🚀 New batches starting for Class 10 & 12 Board Exams - Enroll Now!</span>
          <span className="mx-8 text-primary shadow-glass-lg rounded px-2 bg-white font-bold ml-1 mr-1">OFFER</span>
          <span className="mx-8">🎓 Limited Scholarship seats available for top performers. Call today!</span>
          <span className="mx-8">✨ Experience Ranchi's Best Coaching with Free Demo Classes.</span>
          {/* Replicating for seamless loop */}
          <span className="mx-8">🚀 New batches starting for Class 10 & 12 Board Exams - Enroll Now!</span>
          <span className="mx-8 text-primary shadow-glass-lg rounded px-2 bg-white font-bold ml-1 mr-1">OFFER</span>
          <span className="mx-8">🎓 Limited Scholarship seats available for top performers. Call today!</span>
          <span className="mx-8">✨ Experience Ranchi's Best Coaching with Free Demo Classes.</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className={`transition-all duration-300 ${navbarBg}`}>
        <div className="container-pad">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.png?v=2" alt="SRM Classes" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
              <span className={`font-display font-bold text-xl transition-colors duration-300 ${isLightText ? 'text-[#EAEFFE]' : 'text-brand-dark'}`}>
                SRM <span className={isLightText ? 'text-white' : 'text-gradient'}>Classes</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => {
                    const baseColors = isLightText 
                      ? 'text-[#EAEFFE] hover:text-white hover:bg-white/10' 
                      : 'text-brand-dark hover:text-primary hover:bg-primary/5';
                    const activeColors = isLightText
                      ? 'text-white bg-white/20'
                      : 'text-primary bg-primary/10';
                    return `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? activeColors : baseColors
                    }`;
                  }}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* CTA / Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-48 glass rounded-2xl shadow-glass-lg p-2 animate-slide-up">
                      <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-brand-dark hover:bg-primary/10 hover:text-primary transition-all">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full transition-all">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className={`text-sm py-2 px-4 rounded-xl font-medium transition-all ${isLightText ? 'text-[#EAEFFE] hover:bg-white/10' : 'text-brand-dark hover:bg-primary/5'}`}>Login</Link>
                  <Link to="/register" className="btn-primary text-sm py-2.5 px-5">Register Free</Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl hover:bg-primary/10 transition-all md:hidden"
            >
              {isOpen ? <X className={`w-6 h-6 ${isLightText ? 'text-[#EAEFFE]' : 'text-brand-dark'}`} /> : <Menu className={`w-6 h-6 ${isLightText ? 'text-[#EAEFFE]' : 'text-brand-dark'}`} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-glass-lg border-t border-primary/10 animate-slide-up md:hidden">
            <div className="container-pad py-4 space-y-1">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-brand-dark hover:text-primary hover:bg-primary/5'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-3 flex flex-col gap-2 border-t border-primary/10">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="btn-outline text-center py-2.5 text-sm">Dashboard</Link>
                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn-ghost text-center py-2.5 text-sm text-red-500">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="btn-outline text-center py-2.5 text-sm">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary text-center py-2.5 text-sm">Register Free</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
