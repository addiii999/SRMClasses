import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Calendar, BookOpen, GraduationCap, Trophy,
  Image, Bell, LogOut, Menu, X, Upload, Trash2, CheckCircle,
  AlertCircle, Clock, TrendingUp, FileText, Plus, Search, Filter
} from 'lucide-react';

// ─── Sidebar nav items ────────────────────────────────────────────
const navItems = [
  { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/enquiries', label: 'Enquiries (CRM)', icon: Users },
  { path: '/admin/demo', label: 'Demo Bookings', icon: Calendar },
  { path: '/admin/materials', label: 'Study Materials', icon: BookOpen },
  { path: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { path: '/admin/results', label: 'Results', icon: Trophy },
  { path: '/admin/gallery', label: 'Gallery', icon: Image },
  { path: '/admin/announcements', label: 'Announcements', icon: Bell },
  { path: '/admin/syllabus', label: 'Syllabus', icon: FileText },
];

// ─── Admin Sidebar ─────────────────────────────────────────────────
function AdminSidebar({ open, onClose }) {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { adminLogout(); navigate('/admin/login'); };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-brand-dark z-40 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">SRM Classes</p>
              <p className="text-white/40 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-brand text-white shadow-glass' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <Icon className="w-4 h-4 shrink-0" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-400/10 w-full text-sm font-medium transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Overview Page ─────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState({ enquiries: 0, demos: 0, materials: 0, students: 0 });
  const [recentEnquiries, setRecentEnquiries] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('srmAdminToken');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      api.get('/enquiries', { headers }),
      api.get('/demo', { headers }),
      api.get('/materials', { headers }),
    ]).then(([enqRes, demoRes, matRes]) => {
      setStats({ enquiries: enqRes.data.count, demos: demoRes.data.count, materials: matRes.data.data?.length || 0 });
      setRecentEnquiries(enqRes.data.data?.slice(0, 5) || []);
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Enquiries', value: stats.enquiries, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Demo Bookings', value: stats.demos, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Study Materials', value: stats.materials, icon: BookOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Success Rate', value: '98%', icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600' },
  ];

  const statusBadge = (status) => {
    const map = { New: 'badge-new', Contacted: 'badge-contacted', Converted: 'badge-converted' };
    return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-brand-dark">Dashboard Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-display font-bold text-brand-dark">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-brand-dark mb-4">Recent Enquiries</h3>
        {recentEnquiries.length === 0
          ? <p className="text-gray-400 text-sm">No enquiries yet.</p>
          : <div className="space-y-3">
            {recentEnquiries.map(e => (
              <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg">
                <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0">{e.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-dark text-sm truncate">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.mobile} • Class {e.studentClass}</p>
                </div>
                {statusBadge(e.status)}
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ─── Enquiries / CRM Page ─────────────────────────────────────────
function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('srmAdminToken')}` });

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/enquiries?status=${filterStatus}&search=${search}`, { headers: getHeaders() });
      setEnquiries(res.data.data || []);
    } catch { toast.error('Failed to load enquiries'); }
    finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/enquiries/${id}`, { status }, { headers: getHeaders() });
      toast.success('Status updated!');
      fetchEnquiries();
    } catch { toast.error('Update failed'); }
  };

  const deleteEnquiry = async (id) => {
    if (!confirm('Delete this enquiry?')) return;
    try { await api.delete(`/enquiries/${id}`, { headers: getHeaders() }); toast.success('Deleted'); fetchEnquiries(); }
    catch { toast.error('Delete failed'); }
  };

  const statusColors = { New: 'badge-new', Contacted: 'badge-contacted', Converted: 'badge-converted' };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Enquiries – CRM</h2>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 py-2" placeholder="Search name, email, mobile..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field py-2 w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {['all', 'New', 'Contacted', 'Converted'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-brand-bg">
              {['Name', 'Email', 'Mobile', 'Class', 'Message', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : enquiries.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No enquiries found.</td></tr>
              ) : enquiries.map(e => (
                <tr key={e._id} className="border-b border-gray-50 hover:bg-brand-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-dark">{e.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.email}</td>
                  <td className="px-4 py-3 text-gray-600">{e.mobile}</td>
                  <td className="px-4 py-3">{e.studentClass ? `Class ${e.studentClass}` : '–'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{e.message}</td>
                  <td className="px-4 py-3">
                    <select value={e.status} onChange={ev => updateStatus(e._id, ev.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                      {['New', 'Contacted', 'Converted'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteEnquiry(e._id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Demo Bookings Page ───────────────────────────────────────────
function DemoBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('srmAdminToken')}` });

  const fetchBookings = async () => {
    setLoading(true);
    try { const res = await api.get('/demo', { headers: getHeaders() }); setBookings(res.data.data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.patch(`/demo/${id}`, { status }, { headers: getHeaders() }); toast.success('Updated!'); fetchBookings(); }
    catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this booking?')) return;
    try { await api.delete(`/demo/${id}`, { headers: getHeaders() }); toast.success('Deleted'); fetchBookings(); }
    catch { toast.error('Failed'); }
  };

  const statusColors = { Pending: 'badge bg-yellow-100 text-yellow-700', Confirmed: 'badge bg-blue-100 text-blue-600', Completed: 'badge bg-green-100 text-green-700', Cancelled: 'badge bg-red-100 text-red-600' };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Demo Class Bookings</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-brand-bg">
              {['Name', 'Mobile', 'Class', 'Subject', 'Preferred Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? Array(4).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No bookings yet.</td></tr>
              ) : bookings.map(b => (
                <tr key={b._id} className="border-b border-gray-50 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium text-brand-dark">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600">{b.mobile}</td>
                  <td className="px-4 py-3">Class {b.studentClass}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{b.subject || '–'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{b.preferredDate ? new Date(b.preferredDate).toLocaleDateString('en-IN') : '–'} {b.preferredTime}</td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={e => updateStatus(b._id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                      {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(b._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Study Materials Page ─────────────────────────────────────────
function Materials() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: '', studentClass: '', subject: '', type: 'notes', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMaterials = async () => {
    try { const res = await api.get('/materials?studentClass=all'); setMaterials(res.data.data || []); }
    catch {}
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);
    setLoading(true);
    try {
      await api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Material uploaded!');
      setForm({ title: '', studentClass: '', subject: '', type: 'notes', description: '' });
      setFile(null);
      fetchMaterials();
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  };

  const deleteMaterial = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/materials/${id}`); toast.success('Deleted'); fetchMaterials(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Study Materials</h2>
      <form onSubmit={handleUpload} className="card p-6 space-y-4">
        <h3 className="font-semibold text-brand-dark flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Upload New Material</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Title</label><input className="input-field" placeholder="e.g. Chapter 5 Notes" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Class</label>
            <select className="input-field" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} required>
              <option value="">Select Class</option>
              <option value="all">All Classes</option>
              {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div><label className="label">Subject</label><input className="input-field" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
          <div><label className="label">Type</label>
            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="notes">Notes</option>
              <option value="test_paper">Test Paper</option>
              <option value="assignment">Assignment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Upload File (PDF)</label>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20 file:cursor-pointer" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-60">
          <Upload className="w-4 h-4" /> {loading ? 'Uploading...' : 'Upload Material'}
        </button>
      </form>
      <div className="space-y-3">
        {materials.map(m => (
          <div key={m._id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-dark text-sm truncate">{m.title}</p>
              <p className="text-xs text-gray-400">Class {m.studentClass} • {m.subject} • {m.type}</p>
            </div>
            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-3">View</a>
            <button onClick={() => deleteMaterial(m._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Courses Management ────────────────────────────────────────────
function CoursesAdmin() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ className: '', subjects: '', duration: '1 Year', batchTimings: '' });
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    try { const res = await api.get('/courses/all'); setCourses(res.data.data || []); } catch {}
  };
  useEffect(() => { fetchCourses(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/courses', {
        ...form,
        subjects: form.subjects.split(',').map(s => s.trim()),
        batchTimings: form.batchTimings.split(',').map(b => b.trim()),
      });
      toast.success('Course created!'); fetchCourses();
      setForm({ className: '', subjects: '', duration: '1 Year', batchTimings: '' });
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/courses/${id}`); toast.success('Deleted'); fetchCourses(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Course Management</h2>
      <form onSubmit={handleCreate} className="card p-6 space-y-4">
        <h3 className="font-semibold text-brand-dark flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add New Course</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Class</label>
            <select className="input-field" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} required>
              <option value="">Select</option>
              {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div><label className="label">Duration</label><input className="input-field" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
        </div>
        <div><label className="label">Subjects (comma-separated)</label><input className="input-field" placeholder="Mathematics, Science, English" value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} required /></div>
        <div><label className="label">Batch Timings (comma-separated)</label><input className="input-field" placeholder="7:00 AM - 8:30 AM, 4:00 PM - 5:30 PM" value={form.batchTimings} onChange={e => setForm({ ...form, batchTimings: e.target.value })} /></div>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60"><Plus className="w-4 h-4 inline mr-1" />{loading ? 'Creating...' : 'Create Course'}</button>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map(c => (
          <div key={c._id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold">{c.className}</div>
              <button onClick={() => deleteCourse(c._id)} className="text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
            <p className="font-semibold text-brand-dark mb-1">Class {c.className}</p>
            <p className="text-xs text-gray-400 mb-2">{c.subjects?.join(', ')}</p>
            {c.batchTimings?.map((t, i) => <span key={i} className="block text-xs text-primary">{t}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Results Management ───────────────────────────────────────────
function ResultsAdmin() {
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({ studentName: '', studentClass: '', score: '', achievement: '', year: new Date().getFullYear().toString() });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    try { const res = await api.get('/results'); setResults(res.data.data || []); } catch {}
  };
  useEffect(() => { fetchResults(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append('image', file);
    try {
      await api.post('/results', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Result added!'); fetchResults();
      setForm({ studentName: '', studentClass: '', score: '', achievement: '', year: new Date().getFullYear().toString() });
      setFile(null);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/results/${id}`); toast.success('Deleted'); fetchResults(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Results Management</h2>
      <form onSubmit={handleCreate} className="card p-6 space-y-4">
        <h3 className="font-semibold text-brand-dark flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add Result</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Student Name</label><input className="input-field" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} required /></div>
          <div><label className="label">Class</label>
            <select className="input-field" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} required>
              <option value="">Select</option>
              {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div><label className="label">Score</label><input className="input-field" placeholder="e.g. 95% or AIR 4200" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} /></div>
          <div><label className="label">Year</label><input className="input-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
        </div>
        <div><label className="label">Achievement</label><input className="input-field" placeholder="e.g. Board Topper" value={form.achievement} onChange={e => setForm({ ...form, achievement: e.target.value })} /></div>
        <div><label className="label">Photo (optional)</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20 file:cursor-pointer" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">{loading ? 'Adding...' : 'Add Result'}</button>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(r => (
          <div key={r._id} className="card p-5 flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0">🏆</div>
            <div className="flex-1">
              <p className="font-semibold text-brand-dark">{r.studentName}</p>
              <p className="text-primary font-bold">{r.score}</p>
              <p className="text-xs text-gray-400">{r.achievement} • {r.year}</p>
            </div>
            <button onClick={() => del(r._id)} className="text-red-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gallery Management ────────────────────────────────────────────
function GalleryAdmin() {
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'events', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    try { const res = await api.get('/gallery'); setImages(res.data.data || []); } catch {}
  };
  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Select an image'); return; }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('image', file);
    setLoading(true);
    try {
      await api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Image uploaded!'); fetchImages();
      setForm({ title: '', category: 'events', description: '' }); setFile(null);
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/gallery/${id}`); toast.success('Deleted'); fetchImages(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Gallery Management</h2>
      <form onSubmit={handleUpload} className="card p-6 space-y-4">
        <h3 className="font-semibold text-brand-dark flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Upload Image</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Title</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['events', 'results', 'campus', 'activities', 'other'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">Image</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20 file:cursor-pointer" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">{loading ? 'Uploading...' : 'Upload Image'}</button>
      </form>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(img => (
          <div key={img._id} className="card overflow-hidden group relative">
            <img src={img.imageUrl} alt={img.title} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <button onClick={() => del(img._id)} className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 border-t border-gray-100">
              <p className="text-xs font-medium text-brand-dark truncate">{img.title}</p>
              <p className="text-xs text-primary capitalize">{img.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Announcements Management ─────────────────────────────────────
function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', targetClass: 'all', priority: 'medium' });
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try { const res = await api.get('/announcements?studentClass=all'); setAnnouncements(res.data.data || []); } catch {}
  };
  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/announcements', form);
      toast.success('Announcement posted!'); fetchAnnouncements();
      setForm({ title: '', body: '', targetClass: 'all', priority: 'medium' });
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); fetchAnnouncements(); } catch {}
  };

  const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Announcements</h2>
      <form onSubmit={handleCreate} className="card p-6 space-y-4">
        <h3 className="font-semibold text-brand-dark flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Post Announcement</h3>
        <div><label className="label">Title</label><input className="input-field" placeholder="Announcement title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label className="label">Message</label><textarea className="input-field resize-none" rows={4} placeholder="Write announcement..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Target Class</label>
            <select className="input-field" value={form.targetClass} onChange={e => setForm({ ...form, targetClass: e.target.value })}>
              <option value="all">All Classes</option>
              {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div><label className="label">Priority</label>
            <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {['low', 'medium', 'high'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">
          <Bell className="w-4 h-4 inline mr-2" />{loading ? 'Posting...' : 'Post Announcement'}
        </button>
      </form>
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a._id} className="card p-5 flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-brand-dark">{a.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority]}`}>{a.priority}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Class {a.targetClass}</span>
              </div>
              <p className="text-gray-500 text-sm">{a.body}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <button onClick={() => del(a._id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Syllabus Management ─────────────────────────────────────
function SyllabusAdmin() {
  const [syllabuses, setSyllabuses] = useState([]);
  const [file, setFile] = useState(null);
  const [board, setBoard] = useState('CBSE');
  const [classLevel, setClassLevel] = useState('10');
  const [loading, setLoading] = useState(false);

  const fetchSyllabus = async () => {
    try {
      const res = await api.get('/syllabus');
      setSyllabuses(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchSyllabus(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a PDF file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; }

    const formData = new FormData();
    formData.append('board', board);
    formData.append('classLevel', classLevel);
    formData.append('pdfFile', file);

    setLoading(true);
    try {
      await api.post('/syllabus', formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('srmAdminToken')}`
        } 
      });
      toast.success('Syllabus updated successfully');
      setFile(null);
      // Reset input element
      document.getElementById('syllabus-file-input').value = '';
      fetchSyllabus();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Upload failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-brand-dark">Syllabus Management</h2>
      <form onSubmit={handleUpload} className="card p-6 space-y-4">
        <h3 className="font-semibold text-brand-dark flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> Upload Syllabus PDF
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Board</label>
            <select className="input-field" value={board} onChange={e => {
              setBoard(e.target.value);
              // reset class based on board
              setClassLevel(e.target.value === 'CBSE' ? '10' : '10');
            }}>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
            </select>
          </div>
          <div>
            <label className="label">Class</label>
            <select className="input-field" value={classLevel} onChange={e => setClassLevel(e.target.value)}>
              {board === 'CBSE' 
                ? ['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)
                : ['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)
              }
            </select>
          </div>
        </div>
        <div>
          <label className="label">Upload PDF (Max 5MB)</label>
          <input 
            id="syllabus-file-input"
            type="file" 
            accept=".pdf" 
            onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20 file:cursor-pointer" 
            required 
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 disabled:opacity-60">
          <Upload className="w-4 h-4 inline mr-2" />{loading ? 'Uploading...' : 'Upload Syllabus'}
        </button>
      </form>
      
      <div className="space-y-3 mt-8">
        <h3 className="font-semibold text-brand-dark">Uploaded Syllabuses</h3>
        {syllabuses.length === 0 ? (
          <p className="text-gray-500 text-sm">No syllabuses uploaded yet.</p>
        ) : (
          syllabuses.map(s => (
            <div key={s._id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand-dark">{s.board}</span>
                  <span className="text-xs bg-brand-bg text-brand-dark px-2 py-0.5 rounded-full font-medium">Class {s.classLevel}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Updated {new Date(s.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric'})} • {s.fileName}</p>
              </div>
              <a href={s.pdfUrl.replace('/raw/upload/', '/raw/upload/fl_attachment:false/')} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-3">View PDF</a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main AdminDashboard Layout ────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-primary/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button className="lg:hidden p-2 rounded-xl hover:bg-primary/10" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-brand-dark" />
          </button>
          <h1 className="font-display font-bold text-brand-dark">SRM Classes – Admin Panel</h1>
        </header>
        <div className="flex-1 p-6">
          <Routes>
            <Route path="dashboard" element={<Overview />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="demo" element={<DemoBookings />} />
            <Route path="materials" element={<Materials />} />
            <Route path="courses" element={<CoursesAdmin />} />
            <Route path="results" element={<ResultsAdmin />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="announcements" element={<AnnouncementsAdmin />} />
            <Route path="syllabus" element={<SyllabusAdmin />} />
            <Route index element={<Overview />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
