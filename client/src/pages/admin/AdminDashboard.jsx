import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Calendar, BookOpen, GraduationCap, Trophy,
  Image, Bell, LogOut, Menu, X, Upload, Trash2, CheckCircle,
  AlertCircle, AlertTriangle, Clock, TrendingUp, FileText, Plus, Search, Filter, CreditCard, ShieldCheck, ClipboardList, History, ArrowRight, XCircle
} from 'lucide-react';
import AdminFeeManagement from './AdminFeeManagement';
import AdminFaculty from './AdminFaculty';
import StudentVerification from './StudentVerification';
import AdminRecycleBin from './AdminRecycleBin';
import AddStudent from './AddStudent';
import AdminWeeklyTests from './AdminWeeklyTests';
import AdminAuditLogs from './AdminAuditLogs';
import AdminManagement from './AdminManagement';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// ─── Sidebar nav items ────────────────────────────────────────────
const navItems = [
  { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/enquiries', label: 'Enquiries (CRM)', icon: FileText },
  { path: '/admin/verify-students', label: 'Student Management', icon: ShieldCheck },
  { path: '/admin/board-requests', label: 'Board Change Requests', icon: ClipboardList },
  { path: '/admin/manage-admins', label: 'Admin Management', icon: ShieldCheck, superAdminOnly: true },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: History },
  { path: '/admin/demo', label: 'Demo Bookings', icon: Calendar },
  { path: '/admin/faculty', label: 'Faculty Management', icon: Users },
  { path: '/admin/materials', label: 'Study Materials', icon: BookOpen },
  { path: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { path: '/admin/results', label: 'Results', icon: Trophy },
  { path: '/admin/gallery', label: 'Gallery', icon: Image },
  { path: '/admin/announcements', label: 'Announcements', icon: Bell },
  { path: '/admin/fees', label: 'Fee Management', icon: CreditCard },
  { path: '/admin/weekly-tests', label: 'Weekly Tests', icon: ClipboardList },
  { path: '/admin/recycle-bin', label: 'Recycle Bin', icon: Trash2 },
  { path: '/admin/add-student', label: 'Add Student', icon: Plus },
];

// ─── Admin Sidebar ─────────────────────────────────────────────────
function AdminSidebar({ open, onClose, adminRole }) {
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
          {navItems.filter(item => !item.superAdminOnly || adminRole === 'SUPER_ADMIN').map(({ path, label, icon: Icon }) => (
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
function Overview({ selectedBranch }) {
  const [stats, setStats] = useState({ enquiries: 0, demos: 0, materials: 0, students: 0 });
  const [recentEnquiries, setRecentEnquiries] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('srmAdminToken');
    const headers = { Authorization: `Bearer ${token}` };
    const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
    Promise.all([
      api.get(`/enquiries?limit=100${branchParam}`, { headers }),
      api.get(`/demo?limit=5${branchParam}`, { headers }),
      api.get(`/materials?all=true${branchParam}`, { headers }),
      api.get(`/admin/student-stats?${branchParam}`, { headers }),
    ]).then(([enqRes, demoRes, matRes, statsRes]) => {
      const allEnquiries = enqRes.data.data || [];
      setStats({ 
        enquiries: enqRes.data.count, 
        demos: demoRes.data.count, 
        materials: matRes.data.data?.length || 0,
        totalStudents: statsRes.data.data?.totalStudents || 0,
        activeStudents: statsRes.data.data?.activeStudents || 0,
        enquiryData: allEnquiries
      });
      setRecentEnquiries(allEnquiries.slice(0, 5));
    }).catch(() => { });
  }, [selectedBranch]);

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Students', value: stats.activeStudents, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Demo Bookings', value: stats.demos, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Study Materials', value: stats.materials, icon: BookOpen, color: 'bg-amber-50 text-amber-600' },
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
      
      {/* 📊 Growth Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enquiry Status Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Enquiry Status Breakdown
          </h3>
          <div className="h-64">
            <Bar 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } }
              }}
              data={{
                labels: ['New', 'Contacted', 'Converted'],
                datasets: [{
                  label: 'Enquiries',
                  data: [
                    stats.enquiryData?.filter(e => e.status === 'New').length || 0,
                    stats.enquiryData?.filter(e => e.status === 'Contacted').length || 0,
                    stats.enquiryData?.filter(e => e.status === 'Converted').length || 0
                  ],
                  backgroundColor: ['#9787F3', '#60A5FA', '#34D399'],
                  borderRadius: 8
                }]
              }}
            />
          </div>
        </div>

        {/* Dummy Growth Trend (Student Registration Placeholder) */}
        <div className="card p-6">
          <h3 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Student Onboarding Trend
          </h3>
          <div className="h-64">
            <Line 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                  y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                  x: { grid: { display: false } }
                }
              }}
              data={{
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                  label: 'New Students',
                  data: [2, 5, 8, stats.totalStudents || 0],
                  borderColor: '#9787F3',
                  backgroundColor: 'rgba(151, 135, 243, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4
                }]
              }}
            />
          </div>
        </div>
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
function Enquiries({ selectedBranch }) {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem('srmAdminToken')}` });

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
      const res = await api.get(`/enquiries?status=${filterStatus}&search=${search}&sortBy=${sortBy}${branchParam}`, { headers: getHeaders() });
      setEnquiries(res.data.data || []);
    } catch { toast.error('Failed to load enquiries'); }
    finally { setLoading(false); }
  }, [filterStatus, search, selectedBranch, sortBy]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/enquiries/${id}`, { status }, { headers: getHeaders() });
      toast.success('Status updated!');
      fetchEnquiries();
    } catch { toast.error('Update failed'); }
  };

  const deleteEnquiry = async (id) => {
    if (!confirm('Move this enquiry to Recycle Bin?')) return;
    try { await api.delete(`/enquiries/${id}`, { headers: getHeaders() }); toast.success('Moved to Recycle Bin'); fetchEnquiries(); }
    catch { toast.error('Move failed'); }
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
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-gray-400 uppercase">Sort By:</span>
           <select className="input-field py-2 w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
             <option value="date">Date</option>
             <option value="school">School</option>
             <option value="class">Class</option>
           </select>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-brand-bg">
              {['Name', 'Email', 'Mobile', 'School', 'Class', 'Message', 'Status', 'Actions'].map(h => (
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
                  <td className="px-4 py-3 text-primary font-medium text-xs truncate max-w-[150px]" title={e.schoolName}>{e.schoolName}</td>
                  <td className="px-4 py-3">{e.studentClass ? `Class ${e.studentClass}` : '–'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{e.message || <span className="text-gray-300 italic">None</span>}</td>
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
function DemoBookings({ selectedBranch }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [localBranch, setLocalBranch] = useState(selectedBranch || '');
  
  const [quickConvertModal, setQuickConvertModal] = useState(null);
  const [quickConvertForm, setQuickConvertForm] = useState({ feeType: 'None', satPercentage: 0, installmentPlan: 1, board: 'CBSE' });
  const isDevMode = true; // Enabled for production too now

  const getHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem('srmAdminToken')}` });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const branchParam = localBranch ? `&branch=${localBranch}` : '';
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
      const res = await api.get(`/demo?${branchParam}${statusParam}`, { headers: getHeaders() });
      setBookings(res.data.data || []);
    } catch { toast.error('Failed to load demo bookings'); }
    finally { setLoading(false); }
  }, [localBranch, filterStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    if (selectedBranch !== undefined) setLocalBranch(selectedBranch);
  }, [selectedBranch]);

  const handleAction = async (id, action) => {
    try {
      let res;
      if (action === 'visited') res = await api.patch(`/demo/${id}/visited`, {}, { headers: getHeaders() });
      else if (action === 'convert') res = await api.post(`/demo/${id}/convert`, {}, { headers: getHeaders() });
      else if (action === 'reject') res = await api.patch(`/demo/${id}/reject`, {}, { headers: getHeaders() });
      else if (action === 'delete') {
        if (!confirm('Move to Recycle Bin?')) return;
        res = await api.delete(`/demo/${id}`, { headers: getHeaders() });
      }

      toast.success(res.data.message || 'Action completed!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleQuickConvertSubmit = async (e) => {
    e.preventDefault();
    if (!quickConvertModal) return;
    try {
      const res = await api.post(`/demo/${quickConvertModal._id}/convert`, 
        { isQuickConvert: true, ...quickConvertForm }, 
        { headers: getHeaders() }
      );
      toast.success(res.data?.message || 'Quick Convert Success!');
      setQuickConvertModal(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick Convert failed');
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending: 'bg-gray-100 text-gray-600',
      visited: 'bg-blue-100 text-blue-600',
      converted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-600'
    };
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[s] || 'bg-gray-100'}`}>{s}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-brand-dark flex items-center gap-3">
           Demo Class Bookings
           {isDevMode && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1">⚠️ Test Mode Enabled</span>}
        </h2>
        <div className="flex gap-2">
          <select className="text-xs border rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="visited">Visited</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {['Student Info', 'Mobile', 'Branch/Class', 'Preferred Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bookings found.</td></tr>
              ) : bookings.map(b => (
                <tr key={b._id} className="hover:bg-brand-bg/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-brand-dark">{b.name}</div>
                      {b.confidenceStatus === 'Low' && (
                        <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-600 text-[9px] font-bold uppercase rounded flex items-center gap-1" title="Suspicious pattern detected">
                          <AlertTriangle className="w-2.5 h-2.5" /> Low Confidence
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{b.email}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-medium">{b.mobile}</td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-medium text-brand-dark">{b.branch?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-primary font-bold uppercase">Class {b.studentClass}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-medium text-gray-700">{b.preferredDate ? new Date(b.preferredDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '–'}</div>
                    <div className="text-[10px] text-gray-400">{b.preferredTime || '–'}</div>
                  </td>
                  <td className="px-5 py-4">{statusBadge(b.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(b._id, 'visited')} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors">Mark Visited</button>
                          <button onClick={() => handleAction(b._id, 'reject')} className="px-3 py-1 bg-red-50 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">Reject</button>
                        </>
                      )}
                      
                      {b.status === 'visited' && (
                        <>
                          {isDevMode ? (
                            <button onClick={() => { setQuickConvertModal(b); setQuickConvertForm({ feeType: 'None', satPercentage: 0, installmentPlan: 1, board: 'CBSE' }); }} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-shadow shadow-sm flex items-center gap-1">
                              ⚠️ Quick Convert (Test Mode)
                            </button>
                          ) : (
                            <button onClick={() => handleAction(b._id, 'convert')} className="px-3 py-1 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 transition-shadow shadow-sm">Convert to Student</button>
                          )}
                          <button onClick={() => handleAction(b._id, 'reject')} className="px-3 py-1 bg-red-50 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">Reject</button>
                        </>
                      )}

                      {b.status === 'converted' && (
                        <Link to="/admin/verify-students?tab=Active" className="px-3 py-1 bg-brand-bg text-brand-dark border border-primary/10 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" /> View Student
                        </Link>
                      )}

                      {b.status === 'rejected' && (
                        <button onClick={() => handleAction(b._id, 'visited')} className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold hover:bg-gray-200">Re-open</button>
                      )}

                      <button onClick={() => handleAction(b._id, 'delete')} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors ml-auto">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Convert Modal (Dev Only) */}
      {isDevMode && quickConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">⚠️ Quick Convert Student</h3>
               <p className="text-sm text-gray-500 mt-1">Pre-filled from demo booking. Assign fee directly.</p>
            </div>
            <form onSubmit={handleQuickConvertSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label text-xs">Name</label><input className="input-field bg-gray-50 text-sm" value={quickConvertModal.name} disabled /></div>
                <div><label className="label text-xs">Mobile</label><input className="input-field bg-gray-50 text-sm" value={quickConvertModal.mobile} disabled /></div>
                <div><label className="label text-xs">Class</label><input className="input-field bg-gray-50 text-sm" value={`Class ${quickConvertModal.studentClass}`} disabled /></div>
                <div>
                   <label className="label text-xs">Board</label>
                   <select className="input-field text-sm" value={quickConvertForm.board} onChange={e => setQuickConvertForm({...quickConvertForm, board: e.target.value})}>
                     <option value="CBSE">CBSE</option>
                     <option value="ICSE">ICSE</option>
                     <option value="JAC">JAC</option>
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                <div>
                  <label className="label text-xs">Fee Type</label>
                  <select className="input-field text-sm" value={quickConvertForm.feeType} onChange={e => setQuickConvertForm({...quickConvertForm, feeType: e.target.value})}>
                    <option value="None">None</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Advance">Advance</option>
                    <option value="Math-Science">Math-Science</option>
                    <option value="ICSE-Advance">ICSE-Advance</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">SAT Percentage (0-100)</label>
                  <input type="number" min="0" max="100" className="input-field text-sm" value={quickConvertForm.satPercentage} onChange={e => setQuickConvertForm({...quickConvertForm, satPercentage: e.target.value})} />
                </div>
                <div>
                  <label className="label text-xs">Installment Plan</label>
                  <select className="input-field text-sm" value={quickConvertForm.installmentPlan} onChange={e => setQuickConvertForm({...quickConvertForm, installmentPlan: e.target.value})}>
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Installment{n>1?'s':''}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setQuickConvertModal(null)} className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-brand text-white rounded-xl text-sm font-medium shadow-brand hover:opacity-90 transition-opacity">Confirm Creation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Study Materials Page ─────────────────────────────────────────
function Materials({ selectedBranch }) {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: '', studentClass: '', subject: '', type: 'notes', description: '', branch: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
      const res = await api.get(`/materials?studentClass=all${branchParam}`);
      setMaterials(res.data.data || []);
    } catch { }
  }, [selectedBranch]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  useEffect(() => {
    if (selectedBranch) setForm(prev => ({ ...prev, branch: selectedBranch }));
  }, [selectedBranch]);

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
    if (!confirm('Move this material to Recycle Bin?')) return;
    try { await api.delete(`/materials/${id}`); toast.success('Moved to Recycle Bin'); fetchMaterials(); }
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
              {['5', '6', '7', '8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}
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
          <div><label className="label">Branch (Optional)</label>
            <select className="input-field" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
              <option value="">Global (All Branches)</option>
              {/* Note: This component doesn't have the full branches list, but it's passed via prop in the parent. 
                  However, we can just use the selectedBranch for auto-tagging or leave as is if we want simple selection. */}
              {/* For now we'll just allow the selectedBranch to be the default. */}
              {selectedBranch && <option value={selectedBranch}>Selected Branch Only</option>}
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
    try { const res = await api.get('/courses/all'); setCourses(res.data.data || []); } catch { }
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
    if (!confirm('Move this course to Recycle Bin?')) return;
    try { await api.delete(`/courses/${id}`); toast.success('Moved to Recycle Bin'); fetchCourses(); }
    catch { toast.error('Failed'); }
  };

  // Helper to clean timestamp prefix from filename
  const cleanFileName = (name) => {
    if (!name) return '';
    // Remove leading digits and underscore (e.g., "1774984723311_CBSE Class 5.pdf" -> "CBSE Class 5.pdf")
    return name.replace(/^\d+_/, '');
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
              {['5', '6', '7', '8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}
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
    try { const res = await api.get('/results'); setResults(res.data.data || []); } catch { }
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
    if (!confirm('Move this result to Recycle Bin?')) return;
    try { await api.delete(`/results/${id}`); toast.success('Moved to Recycle Bin'); fetchResults(); } catch { toast.error('Failed'); }
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
              {['5', '6', '7', '8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}
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
    try { const res = await api.get('/gallery'); setImages(res.data.data || []); } catch { }
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
    if (!confirm('Move this image to Recycle Bin?')) return;
    try { await api.delete(`/gallery/${id}`); toast.success('Moved to Recycle Bin'); fetchImages(); } catch { toast.error('Failed'); }
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
    try { const res = await api.get('/announcements?studentClass=all'); setAnnouncements(res.data.data || []); } catch { }
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
    if (!confirm('Move this announcement to Recycle Bin?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Moved to Recycle Bin'); fetchAnnouncements(); } catch { }
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
              {['5', '6', '7', '8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}
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

// ─── Board Change Requests Page ────────────────────────────────
function BoardChangeRequests() {
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('srmAdminToken');
      const { data } = await api.get(`/admin/board-change-requests?status=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(data.data || []);
    } catch (err) { 
      const msg = err.response?.data?.message || 'Failed to fetch board change requests';
      toast.error(msg); 
    } 
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id, action, note) => {
    const token = sessionStorage.getItem('srmAdminToken');
    try {
      await api.put(`/admin/board-change-requests/${id}/${action}`, { adminNote: note },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-brand-dark">Board Change Requests</h2>
        <p className="text-gray-500 text-sm">Review and action student board change requests</p>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              tab === t
                ? t === 'pending' ? 'bg-amber-500 text-white' : t === 'approved' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-brand-dark'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No {tab} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req._id} className="card p-4 flex items-center gap-4 group hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                {req.student?.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brand-dark">{req.student?.name || 'Unknown'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  <span className="font-mono bg-gray-50 px-1 py-0.5 rounded">{req.student?.studentId}</span>
                  <span>•</span>
                  <span className="text-red-500 line-through">{req.currentBoard}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="text-green-600 font-semibold">{req.requestedBoard}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(req.requestedAt).toLocaleDateString('en-IN')}</span>
                </div>
                {req.adminNote && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 flex w-fit rounded items-center gap-1 mt-2 font-medium">📋 Note: {req.adminNote}</p>}
                {req.reason && <p className="text-xs text-gray-500 mt-1 italic w-fit text-ellipsis overflow-hidden">"{req.reason}"</p>}
              </div>
              {tab === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(req._id, 'approve', '')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => {
                    const note = prompt('Rejection reason (optional):');
                    if (note !== null) handleAction(req._id, 'reject', note);
                  }}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {tab !== 'pending' && (
                <span className={`text-[10px] border font-bold px-2.5 py-1 rounded-full ${
                  tab === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {tab.toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main AdminDashboard Layout ────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Decode admin role from JWT token
  const adminRole = (() => {
    try {
      const token = sessionStorage.getItem('srmAdminToken');
      if (!token) return null;
      return JSON.parse(atob(token.split('.')[1]))?.role || null;
    } catch { return null; }
  })();

  // Load active branches on mount
  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data?.data || []))
      .catch(() => toast.error('Failed to load branches'));
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} adminRole={adminRole} />
      <main className="flex-1 flex flex-col">
      <header className="bg-white border-b border-primary/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button className="lg:hidden p-2 rounded-xl hover:bg-primary/10" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-brand-dark" />
          </button>
          <h1 className="font-display font-bold text-brand-dark">SRM Classes – Admin Panel</h1>
          {adminRole === 'SUPER_ADMIN' && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded-full border border-purple-200">SUPER_ADMIN</span>
          )}
          {/* Branch filter dropdown */}
          <select className="input-field ml-auto w-48" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            <option value="">All Branches</option>
            {(branches || []).map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </header>
        <div className="flex-1 p-6">
          <Routes>
            <Route path="dashboard" element={<Overview selectedBranch={selectedBranch} />} />
            <Route path="enquiries" element={<Enquiries selectedBranch={selectedBranch} />} />
            <Route path="demo" element={<DemoBookings selectedBranch={selectedBranch} />} />
            <Route path="materials" element={<Materials selectedBranch={selectedBranch} />} />
            <Route path="courses" element={<CoursesAdmin selectedBranch={selectedBranch} />} />
            <Route path="results" element={<ResultsAdmin selectedBranch={selectedBranch} />} />
            <Route path="gallery" element={<GalleryAdmin selectedBranch={selectedBranch} />} />
            <Route path="announcements" element={<AnnouncementsAdmin selectedBranch={selectedBranch} />} />
            <Route path="faculty" element={<AdminFaculty selectedBranch={selectedBranch} />} />
            <Route path="verify-students" element={<StudentVerification selectedBranch={selectedBranch} adminRole={adminRole} />} />
            <Route path="board-requests" element={<BoardChangeRequests />} />
            <Route path="manage-admins" element={<AdminManagement adminRole={adminRole} />} />
            <Route path="audit-logs" element={<AdminAuditLogs adminRole={adminRole} />} />
            <Route path="fees" element={<AdminFeeManagement selectedBranch={selectedBranch} />} />
            <Route path="weekly-tests" element={<AdminWeeklyTests selectedBranch={selectedBranch} />} />
            <Route path="recycle-bin" element={<AdminRecycleBin selectedBranch={selectedBranch} />} />
            <Route path="add-student" element={<AddStudent selectedBranch={selectedBranch} />} />
            <Route index element={<Overview selectedBranch={selectedBranch} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
