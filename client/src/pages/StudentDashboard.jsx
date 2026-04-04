import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bell, FileText, Download, LogOut, GraduationCap, Menu, X, ChevronDown, CreditCard, Clock, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'materials', label: 'Study Materials', icon: BookOpen },
  { id: 'papers', label: 'Test Papers', icon: FileText },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'fees', label: 'My Fees', icon: CreditCard },
];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [papers, setPapers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'materials') {
        const res = await api.get(`/materials?studentClass=${user?.studentClass}&type=notes`);
        setMaterials(res.data.data || []);
      } else if (activeTab === 'papers') {
        const res = await api.get(`/materials?studentClass=${user?.studentClass}&type=test_paper`);
        setPapers(res.data.data || []);
      } else if (activeTab === 'announcements') {
        const res = await api.get(`/announcements?studentClass=${user?.studentClass}`);
        setAnnouncements(res.data.data || []);
      } else if (activeTab === 'fees') {
        const res = await api.get('/fees/my-fee');
        setFeeData(res.data.data || null);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); };

  const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };

  const renderContent = () => {
    if (loading) return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
      </div>
    );

    if (activeTab === 'announcements') return (
      <div className="space-y-4">
        {announcements.length === 0 && <div className="text-center py-16 text-gray-400">No announcements yet.</div>}
        {announcements.map(a => (
          <div key={a._id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-brand-dark">{a.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority]}`}>{a.priority}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{a.body}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    );

    if (activeTab === 'fees') {
      if (!feeData || !feeData.payableAmount) return (
        <div className="text-center py-16">
          <CreditCard className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-500 font-semibold">No fee structure assigned.</h3>
          <p className="text-gray-400 text-sm">Please contact the administration to set up your fee profile.</p>
        </div>
      );

      const progress = Math.min(100, (feeData.paidAmount / feeData.payableAmount) * 100);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-6 bg-gradient-to-br from-brand-dark to-[#3D375B] text-white">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Total Payable</p>
              <h3 className="text-3xl font-display font-bold">₹{feeData.payableAmount.toLocaleString('en-IN')}</h3>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <span>SAT: {feeData.satPercentage}% ({feeData.satDiscountPercent}% off)</span>
                <span>Plan: {feeData.installmentPlan} Mo.</span>
              </div>
            </div>
            <div className="card p-6 bg-white border-2 border-primary/5">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Balance Remaining</p>
              <h3 className={`text-3xl font-display font-bold ${feeData.remainingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                ₹{feeData.remainingAmount.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-gray-400 mt-2">
                {feeData.remainingAmount > 0 
                  ? `👉 You need to pay ₹${feeData.remainingAmount.toLocaleString('en-IN')} more` 
                  : "✅ All dues cleared. Thank you!"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-brand-dark">Payment Progress</span>
              <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-brand transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Installment Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Installment Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {feeData.installments.map((inst) => (
                <div key={inst.number} className={`card p-4 border-2 transition-all ${
                  inst.status === 'Paid' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-50'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">#0{inst.number}</span>
                    {inst.status === 'Paid' ? (
                      <span className="text-[10px] font-extrabold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">PAID</span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">PENDING</span>
                    )}
                  </div>
                  <p className="font-bold text-brand-dark text-lg">₹{inst.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Help Note */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-gray-500 leading-relaxed">
              <p className="font-bold text-brand-dark mb-1">Important Note:</p>
              All online payments must be verified by the office. If you've paid recently and it doesn't show up here, please provide your receipt to the front desk.
            </div>
          </div>
        </div>
      );
    }

    const items = activeTab === 'materials' ? materials : papers;
    return (
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-gray-400">No {activeTab === 'materials' ? 'study materials' : 'test papers'} available yet.</p>
          </div>
        )}
        {items.map(item => (
          <div key={item._id} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-brand-dark truncate">{item.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.subject && <span className="mr-3">📚 {item.subject}</span>}
                <span>Class {item.studentClass === 'all' ? 'All' : item.studentClass}</span>
                {item.fileName && <span className="ml-2 text-gray-300">• {item.fileName}</span>}
              </p>
            </div>
            <a
              href={item.fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shrink-0"
              onClick={() => toast.success('Download started!')}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-40 bg-brand-dark flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">SRM Classes</span>
          </Link>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
              <p className="text-white/50 text-xs">Class {user?.studentClass}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`sidebar-link w-full ${activeTab === id ? 'active' : ''}`}>
                <Icon className="w-5 h-5" /> {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-400/10 w-full transition-all text-sm font-medium">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-white border-b border-primary/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button className="md:hidden p-2 rounded-xl hover:bg-primary/10" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5 text-brand-dark" /> : <Menu className="w-5 h-5 text-brand-dark" />}
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-brand-dark text-lg">Student Portal</h1>
            <p className="text-gray-400 text-xs">Welcome back, {user?.name?.split(' ')[0]}!</p>
          </div>
        </header>

        <div className="flex-1 p-6 max-w-4xl w-full mx-auto">
          {/* Tab header */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === id ? 'bg-gradient-brand text-white shadow-glass' : 'bg-white text-gray-500 hover:text-primary hover:bg-primary/10'
                  }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
