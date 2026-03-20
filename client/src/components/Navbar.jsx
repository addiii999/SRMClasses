import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, GraduationCap, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Courses', to: '/courses' },
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-xl shadow-card border-b border-primary/10' : 'bg-transparent'
    }`}>
      <div className="container-pad">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-brand-dark">
              SRM <span className="text-gradient">Classes</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-brand-dark hover:text-primary hover:bg-primary/5'
                  }`
                }
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
                <Link to="/login" className="btn-ghost text-sm py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2.5 px-5">Register Free</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-primary/10 transition-all"
          >
            {isOpen ? <X className="w-6 h-6 text-brand-dark" /> : <Menu className="w-6 h-6 text-brand-dark" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-glass-lg border-t border-primary/10 animate-slide-up">
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
  );
}
