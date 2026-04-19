import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null); // { type: 'pending'|'rejected', message }
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusBanner(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const code = data?.code;

      // Handle registration status gates with visual banners
      if (code === 'PENDING_APPROVAL') {
        setStatusBanner({ type: 'pending', message: data.message });
      } else if (code === 'REGISTRATION_REJECTED') {
        setStatusBanner({ type: 'rejected', message: data.message });
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 pt-36">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glass">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-brand-dark">SRM Classes</span>
          </Link>
          <h2 className="mt-6 text-3xl font-display font-bold text-brand-dark">Welcome back!</h2>
          <p className="mt-2 text-gray-500">Sign in to access your student dashboard</p>
        </div>

        {/* ── Status Banners ── */}
        {statusBanner?.type === 'pending' && (
          <div className="mb-4 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Registration Pending</p>
              <p className="text-amber-700 text-xs mt-0.5">{statusBanner.message}</p>
              <p className="text-amber-600 text-xs mt-1">You will be notified once an admin approves your account.</p>
            </div>
          </div>
        )}

        {statusBanner?.type === 'rejected' && (
          <div className="mb-4 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-fade-in">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-sm">Registration Rejected</p>
              <p className="text-red-700 text-xs mt-0.5">{statusBanner.message}</p>
              <p className="text-red-600 text-xs mt-1">Please contact the admin for assistance.</p>
            </div>
          </div>
        )}

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input id="email" name="email" type="email" autoComplete="email" className="input-field" placeholder="your@email.com"
                value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setStatusBanner(null); }} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">Password</label>
                {loading ? (
                  <span className="text-xs text-gray-400 font-medium">Forgot password?</span>
                ) : (
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
                )}
              </div>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="input-field pr-12"
                  placeholder="Enter your password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">Register Free</Link>
            </p>
          </div>

          {/* Admin link */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link to="/admin/login" className="text-xs text-gray-400 hover:text-primary transition-colors">Admin Login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
