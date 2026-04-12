import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bell, FileText, Download, LogOut, GraduationCap, Menu, X, ChevronDown, CreditCard, Clock, AlertCircle, History, Trophy, TrendingUp, User, Lock, Edit2, Save, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { fetchBoardClassMap, getAllowedBoardsForClass } from '../utils/boardConstraints';
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
  { id: 'profile', label: 'Profile & Settings', icon: User },
];

function getPercentageColor(pct) {
  if (pct === null || pct === undefined) return 'bg-gray-100 text-gray-500';
  if (pct >= 75) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

export default function StudentDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
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

  // Profile & Board Change State
  const [profileHistory, setProfileHistory] = useState([]);
  const [boardRequests, setBoardRequests] = useState([]);
  const [boardInfo, setBoardInfo] = useState({ remainingChanges: 3, limitReached: false, cooldown: null });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ schoolName: user?.schoolName || '', address: user?.address || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingBoardChange, setRequestingBoardChange] = useState(false);
  const [boardChangeForm, setBoardChangeForm] = useState({ requestedBoard: '' });
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardClassMap, setBoardClassMap] = useState({});

  // Initialize profile form when user object updates
  useEffect(() => {
    if (user) {
      setProfileForm({ schoolName: user.schoolName || '', address: user.address || '' });
    }
  }, [user]);

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

  useEffect(() => {
    fetchNotifications();
    
    // Fetch global configuration
    const initConfigs = async () => {
      const map = await fetchBoardClassMap();
      if (map) setBoardClassMap(map);
    };
    initConfigs();
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

  const fetchProfileData = async () => {
    try {
      const [historyRes, requestsRes, meRes] = await Promise.all([
        api.get('/auth/profile-history'),
        api.get('/board-change/my-requests'),
        api.get('/auth/me')
      ]);
      setProfileHistory(historyRes.data.data || []);
      setBoardRequests(requestsRes.data.data || []);
      if (meRes.data.success && meRes.data.user) {
        updateUser(meRes.data.user);
      }
      setBoardInfo({
        remainingChanges: requestsRes.data.remainingChanges,
        limitReached: requestsRes.data.limitReached,
        cooldown: requestsRes.data.cooldown
      });
    } catch {
      toast.error('Failed to load profile data');
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfileData();
    }
  }, [activeTab]);

  useEffect(() => {
    // Render countdown timer for board change cooldown
    if (boardInfo.cooldown?.active && boardInfo.cooldown.remainingMs > 0) {
      const interval = setInterval(() => {
        setBoardInfo(prev => {
          if (!prev.cooldown) return prev;
          const newMs = prev.cooldown.remainingMs - 1000;
          if (newMs <= 0) {
            clearInterval(interval);
            return { ...prev, cooldown: null };
          }
          return { ...prev, cooldown: { ...prev.cooldown, remainingMs: newMs } };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [boardInfo.cooldown?.active, boardInfo.cooldown?.remainingMs]);

  const formatCooldown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put('/auth/update-profile', profileForm);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
      fetchProfileData(); // refresh history
      user.schoolName = profileForm.schoolName;
      user.address = profileForm.address;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestBoardChange = async () => {
    if (!boardChangeForm.requestedBoard) {
      toast.error('Please select a board');
      return;
    }
    setRequestingBoardChange(true);
    try {
      await api.post('/board-change/request', boardChangeForm);
      toast.success('Board change request submitted submitted');
      setShowBoardModal(false);
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setRequestingBoardChange(false);
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
                    {['Test Name', 'Subject', 'Board', 'Date', 'Marks', 'Percentage', 'Status'].map((h) => (
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
                      <td className="px-4 py-3">
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100 uppercase">{r.testId?.board || 'CBSE'}</span>
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
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 text-[10px] text-white/70">
                <div className="flex justify-between items-center">
                  <span>SAT: {feeData.satPercentage}% ({feeData.satDiscountPercent}% off)</span>
                  <span>Plan: {feeData.installmentPlan} Mo.</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span>Admission Fee:</span>
                  <span>{feeData.admissionFee > 0 ? `₹${feeData.admissionFee}` : 'Not Applicable (₹0)'}</span>
                </div>
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

    if (activeTab === 'profile') {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Profile Overview */}
          <div className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-glass">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-brand-dark">{user?.name}</h3>
                  <p className="text-gray-500 text-sm font-mono mt-0.5">{user?.studentId}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user?.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {user?.registrationStatus}
                </div>
                {user?.batch && <div className="mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Batch: {user.batch}</div>}
                {!user?.batch && <div className="mt-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Unassigned Batch</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Mobile <Lock className="w-3 h-3" /></label>
                  <p className="font-semibold text-brand-dark">+91 {user?.mobile}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Email <Lock className="w-3 h-3" /></label>
                  <p className="font-semibold text-brand-dark">{user?.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Class <Lock className="w-3 h-3" /></label>
                  <p className="font-semibold text-brand-dark">Class {user?.studentClass}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Board <Lock className="w-3 h-3" /></label>
                  <p className="font-semibold text-brand-dark">{user?.board}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Parent Name <Lock className="w-3 h-3" /></label>
                  <p className="font-semibold text-brand-dark">{user?.parentName || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">Parent Contact <Lock className="w-3 h-3" /></label>
                  <p className="font-semibold text-brand-dark">{user?.parentContact ? `+91 ${user.parentContact}` : '—'}</p>
                </div>
                
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">School Name</label>
                    {!editingProfile && (
                      <button onClick={() => setEditingProfile(true)} className="text-primary text-[10px] font-bold uppercase flex items-center gap-1 hover:underline">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                  {editingProfile ? (
                    <input className="input-field py-1.5 text-sm" value={profileForm.schoolName} onChange={e => setProfileForm({...profileForm, schoolName: e.target.value})} />
                  ) : (
                    <p className="font-semibold text-brand-dark">{user?.schoolName || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Home Address</label>
                  {editingProfile ? (
                    <textarea className="input-field py-1.5 text-sm resize-none" rows={2} value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                  ) : (
                    <p className="font-semibold text-brand-dark">{user?.address || '—'}</p>
                  )}
                </div>
              </div>
            </div>

            {editingProfile && (
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => { setEditingProfile(false); setProfileForm({ schoolName: user?.schoolName || '', address: user?.address || '' }); }} className="btn-ghost py-2" disabled={savingProfile}>Cancel</button>
                <button onClick={handleUpdateProfile} className="btn-primary py-2 flex items-center gap-2" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            )}
          </div>

          {/* Board Change Section */}
          <div className="card p-6 border-l-4 border-primary">
            <h4 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Board Change Requests
            </h4>
            
            <div className="bg-brand-bg rounded-xl p-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="font-semibold text-brand-dark">Current Board: <span className="text-primary font-bold">{user?.board}</span></p>
                <p className="text-xs text-gray-500 mt-1">
                  You have <strong className={boardInfo.remainingChanges > 0 ? 'text-emerald-600' : 'text-red-600'}>{boardInfo.remainingChanges} of 3</strong> changes remaining.
                </p>
              </div>
              
              <button 
                onClick={() => setShowBoardModal(true)}
                disabled={boardInfo.limitReached || (boardInfo.cooldown && boardInfo.cooldown.active) || boardRequests.some(r => r.status === 'pending')}
                className="btn-primary py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Request Board Change
              </button>
            </div>

            {boardInfo.cooldown?.active && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200 animate-pulse">
                <Clock className="w-4 h-4 text-amber-500" />
                Next request available in: {formatCooldown(boardInfo.cooldown.remainingMs)}
              </div>
            )}

            {boardRequests.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-2">Request History</h5>
                {boardRequests.map(req => (
                  <div key={req._id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">Change to <span className="text-primary">{req.requestedBoard}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(req.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                      {req.adminNote && req.status === 'rejected' && <p className="text-[10px] text-red-500 mt-1 limit-lines-1 max-w-[150px]">{req.adminNote}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Edit History */}
          <div className="card p-6">
            <h4 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" /> Profile Edit History
            </h4>
            {profileHistory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No edits have been made to your profile.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-gray-100">
                {profileHistory.map((log, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center -ml-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-brand-dark capitalize">{log.field.replace(/([A-Z])/g, ' $1').trim()} Updated</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="line-through text-red-400 mr-2">{log.oldValue || 'None'}</span>
                          <span className="font-bold text-emerald-600">{log.newValue || 'None'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400">{new Date(log.changedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <p className="text-[10px] font-semibold text-brand-dark capitalize bg-gray-50 px-2 py-0.5 rounded mt-1 inline-block">By: {log.changedBy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Board Change Modal */}
          {showBoardModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBoardModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-display font-bold text-brand-dark">Request Board Change</h3>
                  <button onClick={() => setShowBoardModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-400"/></button>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed bg-brand-bg p-3 rounded-xl">
                    You are requesting to change your educational board. This request will be reviewed by an administrator. You have {boardInfo.remainingChanges} changes remaining.
                  </p>
                  <div>
                    <label className="label">Select New Board</label>
                    <select className="input-field" value={boardChangeForm.requestedBoard} onChange={e => setBoardChangeForm({requestedBoard: e.target.value})}>
                      <option value="">Select Board</option>
                      {(Object.keys(boardClassMap).length > 0
                        ? Object.keys(boardClassMap).filter(b => boardClassMap[b].includes(String(user?.studentClass)) && b !== user?.board)
                        : ['CBSE', 'ICSE', 'JAC'].filter(b => b !== user?.board)
                      ).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-3">
                  <button onClick={() => setShowBoardModal(false)} className="btn-ghost flex-1 py-2">Cancel</button>
                  <button onClick={handleRequestBoardChange} disabled={requestingBoardChange || !boardChangeForm.requestedBoard} className="btn-primary flex-1 py-2 disabled:opacity-50">
                    {requestingBoardChange ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
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
