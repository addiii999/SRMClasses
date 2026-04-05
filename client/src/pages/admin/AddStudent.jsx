import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function AddStudent() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', studentClass: '', password: '', branch: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data?.data || []))
      .catch(() => toast.error('Failed to load branches'));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/admin/users/create', form);
      toast.success('Student created');
      navigate('/admin/verify-students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  return (
    <div className="card p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-display font-bold mb-4">Add Student (Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="input-field" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="email" className="input-field" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input className="input-field" placeholder="Mobile" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} required />
        <select className="input-field" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} required>
          <option value="">Select Class</option>
          {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <input type="password" className="input-field" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <select className="input-field" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required>
          <option value="">Select Branch</option>
          {(branches || []).map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" /> Create Student <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
