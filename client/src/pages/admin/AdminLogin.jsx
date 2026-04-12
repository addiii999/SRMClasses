import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: 'aayushgupta.srm.540@gmail.com', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/auth/login', form);
      adminLogin(res.data.token);
      toast.success('Admin access granted!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glass-lg mb-5">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white">Admin Portal</h2>
          <p className="mt-2 text-white/50 text-sm">SRM Classes Management System</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-brand-dark mb-1.5">Admin Email</label>
              <input 
                id="admin-email"
                name="admin-email"
                type="email" 
                autoComplete="email"
                className="input-field bg-white/90" 
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-brand-dark mb-1.5">Password</label>
              <div className="relative">
                <input 
                  id="admin-password"
                  name="admin-password"
                  type={showPwd ? 'text' : 'password'} 
                  autoComplete="current-password"
                  className="input-field bg-white/90 pr-12"
                  placeholder="Admin password" 
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                  required 
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 !mt-6">
              {loading ? 'Authenticating...' : <><Shield className="w-4 h-4" /> Enter Admin Panel</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
