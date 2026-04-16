import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, CheckCircle, XCircle, LogOut, ArrowRight, UserPlus, RefreshCw } from 'lucide-react';

export default function AdminManagement({ adminRole }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/admins', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setAdmins(res.data.data);
    } catch (err) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminRole === 'SUPER_ADMIN') {
      fetchAdmins();
    }
  }, [adminRole]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');

    setSubmitting(true);
    try {
      await api.post('/admin/create-admin', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast.success('Admin created successfully');
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await api.put(`/admin/admins/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast.success(`Admin ${res.data.isActive ? 'activated' : 'deactivated'}`);
      setAdmins(admins.map(a => a._id === id ? { ...a, isActive: res.data.isActive } : a));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle admin status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this admin? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/admins/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast.success('Admin deleted securely');
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  if (adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-brand-dark mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md">Only SUPER_ADMINs have access to this page. You are currently logged in as a standard ADMIN.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-brand-dark flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" /> Admin Management
          </h2>
          <p className="text-gray-500 mt-1">Manage admin access, roles, and permissions across the platform.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary py-2 px-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400 p-6">Loading admins...</p>
        ) : (
          admins.map(admin => (
            <div key={admin._id} className="card p-5 border-t-4 border-purple-500 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                    {admin.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-dark">{admin.name}</h3>
                    <p className="text-xs text-gray-500">{admin.email}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                  admin.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {admin.role}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Admin ID:</span>
                  <span className="font-mono text-brand-dark font-medium">{admin.adminId || 'Legacy'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-gray-600">{new Date(admin.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-bold ${admin.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {admin.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </div>

              {admin.role !== 'SUPER_ADMIN' && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => handleToggleActive(admin._id)} className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-brand-dark transition-colors">
                    {admin.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(admin._id)} className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              )}
              {admin.role === 'SUPER_ADMIN' && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-center text-[10px] text-gray-400 font-semibold uppercase">Protected Account</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col pt-6" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pb-2">
              <h3 className="font-display font-bold text-2xl text-brand-dark">Create New Admin</h3>
              <p className="text-sm text-gray-500 mt-1">This user will have standard ADMIN privileges.</p>
            </div>
            
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input-field" placeholder="Admin Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input-field" placeholder="admin@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Temporary Password</label>
                <input type="text" className="input-field font-mono" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
                <p className="text-xs text-amber-600 mt-1">They will be forced to change this upon first login.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 flex justify-center items-center gap-2">
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
