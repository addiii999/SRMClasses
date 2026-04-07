import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bell, FileText, Download, LogOut, GraduationCap, Menu, X, ChevronDown, CreditCard, Clock, AlertCircle, History, Trophy, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const tabs = [
  { id: 'materials', label: 'Study Materials', icon: BookOpen },
  { id: 'papers', label: 'Test Papers', icon: FileText },
  { id: 'results', label: 'My Results', icon: Trophy },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'fees', label: 'My Fees', icon: CreditCard },
];

function getPercentageColor(pct) {
  if (pct === null || pct === undefined) return 'bg-gray-100 text-gray-500';
  if (pct >= 75) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [papers, setPapers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Results state
  const [results, setResults] = useState([]);
  const [resultSubjectFilter, setResultSubjectFilter] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/weekly-tests/my-notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Silently fail — notifications are secondary
    }
  };

  const markAsRead = async (nid) => {
    try {
      await api.patch(`/weekly-tests/notifications/${nid}/read`);
      fetchNotifications();
    } catch { }
  };

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
      } else if (activeTab === 'results') {
        const res = await api.get('/weekly-tests/my-results');
        setResults(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); };

  const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };

  // ─── Results Tab ──────────────────────────────────────────────────
  const renderResults = () => {
    // Get unique subjects
    const subjects = [...new Set(results.map((r) => r.testId?.subject).filter(Boolean))];

    const filtered = resultSubjectFilter
      ? results.filter((r) => r.testId?.subject === resultSubjectFilter)
      : results;

    // ─── Line Chart: progress per subject over time ───────────────
    const buildLineData = () => {
      const subjectsToPlot = resultSubjectFilter ? [resultSubjectFilter] : subjects.slice(0, 5);
      const brandColors = ['#9787F3', '#7B69E8', '#4433C2', '#2D274B', '#60A5FA'];

      const datasets = subjectsToPlot.map((subj, idx) => {
        const subjectResults = results
          .filter((r) => r.testId?.subject === subj && !r.isAbsent)
          .sort((a, b) => new Date(a.testId.date) - new Date(b.testId.date));

        return {
          label: subj,
          data: subjectResults.map((r) => r.percentage),
          borderColor: brandColors[idx % brandColors.length],
          backgroundColor: brandColors[idx % brandColors.length] + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: brandColors[idx % brandColors.length],
        };
      });

      // Use the longest subject's dates as labels
      let maxLen = 0;
      let maxLabels = [];
      datasets.forEach((ds) => {
        if (ds.data.length > maxLen) {
          maxLen = ds.data.length;
          const subjectResults = results
            .filter((r) => r.testId?.subject === ds.label && !r.isAbsent)
            .sort((a, b) => new Date(a.testId.date) - new Date(b.testId.date));
          maxLabels = subjectResults.map((r) =>
            new Date(r.testId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          );
        }
      });

      return { labels: maxLabels, datasets };
    };

    // ─── Bar Chart: subject-wise average percentage ───────────────
    const buildBarData = () => {
      const brandColors = ['#9787F3', '#7B69E8', '#4433C2', '#2D274B', '#60A5FA', '#34D399', '#F59E0B', '#EF4444'];
      const subjectAverages = subjects.map((subj) => {
        const subjectResults = results.filter((r) => r.testId?.subject === subj && !r.isAbsent);
        if (subjectResults.length === 0) return 0;
        const avg = subjectResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / subjectResults.length;
        return Math.round(avg * 100) / 100;
      });

      return {
        labels: subjects,
        datasets: [{
          label: 'Average %',
          data: subjectAverages,
          backgroundColor: subjects.map((_, i) => brandColors[i % brandColors.length] + 'CC'),
          borderColor: subjects.map((_, i) => brandColors[i % brandColors.length]),
          borderWidth: 2,
          borderRadius: 8,
        }],
      };
    };

    const lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 15, font: { family: 'Inter', size: 11 } } },
        tooltip: { backgroundColor: '#2D274B', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' }, cornerRadius: 8, padding: 10 },
      },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { font: { family: 'Inter', size: 11 }, callback: (v) => v + '%' }, grid: { color: '#EAEFFE' } },
        x: { ticks: { font: { family: 'Inter', size: 11 } }, grid: { display: false } },
      },
    };

    const barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#2D274B', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' }, cornerRadius: 8, padding: 10, callbacks: { label: (ctx) => `Average: ${ctx.raw}%` } },
      },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { font: { family: 'Inter', size: 11 }, callback: (v) => v + '%' }, grid: { color: '#EAEFFE' } },
        x: { ticks: { font: { family: 'Inter', size: 11 } }, grid: { display: false } },
      },
    };

    const hasChartData = results.some((r) => !r.isAbsent);

    return (
      <div className="space-y-6">
        {/* Subject Filter */}
        <div className="flex items-center gap-3">
          <select className="input-field py-2 w-auto text-sm" value={resultSubjectFilter}
            onChange={(e) => setResultSubjectFilter(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Results Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto text-gray-200 mb-3" />
            <h3 className="text-gray-500 font-semibold">No results available yet</h3>
            <p className="text-gray-400 text-sm mt-1">Your test results will appear here once published</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-brand-bg">
                    {['Test Name', 'Subject', 'Date', 'Marks', 'Percentage', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-brand-bg/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-dark">{r.testId?.testName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{r.testId?.subject}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.testId?.date ? new Date(r.testId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-dark">
                        {r.isAbsent ? (
                          <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold">AB</span>
                        ) : (
                          <span>{r.marksObtained} / {r.testId?.totalMarks}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.isAbsent ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getPercentageColor(r.percentage)}`}>
                            {r.percentage}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.isAbsent ? (
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">Absent</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Present</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts */}
        {hasChartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart — Progress Over Time */}
            <div className="card p-5">
              <h4 className="font-semibold text-brand-dark text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Weekly Progress
              </h4>
              <div className="h-64">
                <Line data={buildLineData()} options={lineOptions} />
              </div>
            </div>

            {/* Bar Chart — Subject Comparison */}
            <div className="card p-5">
              <h4 className="font-semibold text-brand-dark text-sm mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> Subject-wise Average
              </h4>
              <div className="h-64">
                <Bar data={buildBarData()} options={barOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
      </div>
    );

    if (activeTab === 'results') return renderResults();

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
      const sortedPayments = [...(feeData.payments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

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
                <div key={inst.number} className={`card p-4 border-2 transition-all ${inst.status === 'Paid' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-50'
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

          {/* Payment History */}
          {sortedPayments.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" /> Payment History
              </h4>
              <div className="space-y-3">
                {sortedPayments.map((p, i) => (
                  <div key={p._id || i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shrink-0">₹</div>
                      <div>
                        <p className="font-bold text-brand-dark text-lg">₹{p.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 capitalize">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {p.method}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-xl hover:bg-primary/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-brand-dark" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-semibold text-brand-dark text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                  ) : notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 border-b border-gray-50 hover:bg-brand-bg/30 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => { markAsRead(n._id); setActiveTab('results'); setShowNotifDropdown(false); }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-gray-200' : 'bg-primary'}`} />
                        <div>
                          <p className="font-medium text-brand-dark text-sm">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
