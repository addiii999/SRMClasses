import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  GraduationCap, Users, ChevronRight, AlertTriangle,
  CheckCircle, X, TrendingUp, Clock, Search, RefreshCw
} from 'lucide-react';

const CLASS_LIST = ['5', '6', '7', '8', '9', '10', '11', '12'];
const CLASS_PROGRESSION = {
  '5': '6', '6': '7', '7': '8', '8': '9', '9': '10',
  '10': '11', '11': '12', '12': 'Graduated'
};

function getDefaultAcademicYear() {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function isPromotionSeason() {
  const m = new Date().getMonth(); // 0-indexed
  return m === 2 || m === 3; // March or April
}

export default function AdminPromotionManager({ branches = [] }) {
  // ── Bulk Promotion State ──────────────────────────────────────────────────
  const [fromClass, setFromClass] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [targetYear, setTargetYear] = useState(getDefaultAcademicYear());
  const [feeAction, setFeeAction] = useState('reset');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // ── Individual Promotion State ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [indivYear, setIndivYear] = useState(getDefaultAcademicYear());
  const [indivFeeAction, setIndivFeeAction] = useState('reset');
  const [indivLoading, setIndivLoading] = useState(false);
  const [showIndivModal, setShowIndivModal] = useState(false);

  // ── Smart Banner ──────────────────────────────────────────────────────────
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('promotionBannerDismissed') === 'true'
  );

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('promotionBannerDismissed', 'true');
  };

  // ── Fetch Preview ─────────────────────────────────────────────────────────
  const fetchPreview = async () => {
    if (!fromClass) return toast.error('Please select a class first.');
    setLoadingPreview(true);
    setPreview(null);
    setBulkResult(null);
    try {
      const params = { fromClass };
      if (selectedBranch) params.branch = selectedBranch;
      const { data } = await api.get('/admin/promotion-preview', { params });
      setPreview(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Execute Bulk Promotion ────────────────────────────────────────────────
  const handleBulkPromote = async () => {
    setBulkLoading(true);
    try {
      const body = { fromClass, targetAcademicYear: targetYear, feeAction };
      if (selectedBranch) body.branch = selectedBranch;
      const { data } = await api.post('/admin/students/promote-bulk', body);
      toast.success(data.message);
      setBulkResult(data.data);
      setPreview(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Bulk promotion failed. No changes were made.');
    } finally {
      setBulkLoading(false);
      setShowBulkModal(false);
    }
  };

  // ── Search Students (Individual) ──────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get('/admin/students', {
        params: { search: searchQuery, status: 'Active', limit: 10 }
      });
      setSearchResults(data.data || []);
    } catch (e) {
      toast.error('Search failed.');
    } finally {
      setSearching(false);
    }
  };

  // ── Execute Individual Promotion ──────────────────────────────────────────
  const handleIndivPromote = async () => {
    if (!selectedStudent) return;
    setIndivLoading(true);
    try {
      const { data } = await api.post(`/admin/students/${selectedStudent._id}/promote`, {
        targetAcademicYear: indivYear,
        feeAction: indivFeeAction,
      });
      toast.success(data.message);
      setSelectedStudent(null);
      setSearchResults([]);
      setSearchQuery('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Promotion failed.');
    } finally {
      setIndivLoading(false);
      setShowIndivModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Smart Promotion Season Banner ────────────────────────────────────── */}
      {isPromotionSeason() && !bannerDismissed && (
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">📅 It's Promotion Season!</p>
            <p className="text-amber-700 text-xs mt-0.5">
              It's March/April — time to promote students to the next academic year. Review the list below and confirm before promoting.
            </p>
          </div>
          <button onClick={dismissBanner} className="text-amber-500 hover:text-amber-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── BULK PROMOTION ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-brand-dark text-base">Bulk Promotion</h2>
            <p className="text-xs text-gray-400">Promote all active students of a class at once</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">From Class</label>
              <select className="input-field" value={fromClass} onChange={e => { setFromClass(e.target.value); setPreview(null); setBulkResult(null); }}>
                <option value="">Select Class</option>
                {CLASS_LIST.map(c => (
                  <option key={c} value={c}>Class {c} → {CLASS_PROGRESSION[c] === 'Graduated' ? 'Graduate' : `Class ${CLASS_PROGRESSION[c]}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Branch (optional)</label>
              <select className="input-field" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">New Academic Year</label>
              <input className="input-field" value={targetYear} onChange={e => setTargetYear(e.target.value)} placeholder="e.g. 2026-27" />
            </div>
          </div>

          <div>
            <label className="label">Fee Action on Promotion</label>
            <div className="flex gap-4">
              {[
                { value: 'reset', label: 'Reset Fee Structure', desc: 'Clear feeType & snapshot. Admin must re-assign.' },
                { value: 'keep', label: 'Keep Previous Fee', desc: 'Fee unchanged after promotion.' },
              ].map(opt => (
                <label key={opt.value} className={`flex-1 flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${feeAction === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                  <input type="radio" name="feeAction" value={opt.value} checked={feeAction === opt.value} onChange={() => setFeeAction(opt.value)} className="mt-0.5 accent-primary" />
                  <div>
                    <p className="font-semibold text-sm text-brand-dark">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={fetchPreview} disabled={!fromClass || loadingPreview} className="btn-outline flex items-center gap-2 disabled:opacity-50">
              {loadingPreview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Preview Affected Students
            </button>
          </div>

          {/* Preview Panel */}
          {preview && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-brand-dark">
                    {preview.count} student{preview.count !== 1 ? 's' : ''} will be promoted
                  </p>
                  <p className="text-xs text-gray-500">
                    Class {preview.fromClass} → {preview.toClass === 'Graduated' ? 'Graduated' : `Class ${preview.toClass}`} &nbsp;|&nbsp; Year: {targetYear}
                  </p>
                </div>
                {preview.count > 0 && (
                  <button onClick={() => setShowBulkModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4" />
                    Promote All
                  </button>
                )}
              </div>

              {/* Student List Preview */}
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {preview.students.map(s => (
                  <div key={s._id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-brand-dark">{s.name}</span>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <span>{s.studentId}</span>
                      <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">{s.batch || 'No Batch'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Result Panel */}
          {bulkResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in">
              <p className="font-bold text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Promotion Complete — {bulkResult.promoted} students promoted successfully!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── INDIVIDUAL PROMOTION ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-brand-dark text-base">Individual Promotion</h2>
            <p className="text-xs text-gray-400">Promote a single student manually</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Search student by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={searching} className="btn-outline flex items-center gap-2 disabled:opacity-50">
              <Search className="w-4 h-4" />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && !selectedStudent && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {searchResults.map(s => (
                <button
                  key={s._id}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left transition-colors"
                  onClick={() => { setSelectedStudent(s); setIndivYear(getDefaultAcademicYear()); }}
                >
                  <div>
                    <p className="font-semibold text-brand-dark text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.studentId} · Class {s.studentClass} · {s.board}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-brand-dark">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500">{selectedStudent.studentId} · Class {selectedStudent.studentClass} · {selectedStudent.board}</p>
                  <p className="text-xs font-bold text-primary mt-1">
                    Class {selectedStudent.studentClass} → {CLASS_PROGRESSION[selectedStudent.studentClass] === 'Graduated' ? 'Graduated' : `Class ${CLASS_PROGRESSION[selectedStudent.studentClass]}`}
                  </p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">New Academic Year</label>
                  <input className="input-field" value={indivYear} onChange={e => setIndivYear(e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs">Fee Action</label>
                  <select className="input-field" value={indivFeeAction} onChange={e => setIndivFeeAction(e.target.value)}>
                    <option value="reset">Reset Fee Structure</option>
                    <option value="keep">Keep Previous Fee</option>
                  </select>
                </div>
              </div>

              <button onClick={() => setShowIndivModal(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Promote This Student
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bulk Confirmation Modal ───────────────────────────────────────────── */}
      {showBulkModal && preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-brand-dark text-lg">Confirm Bulk Promotion</h3>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              You are about to promote <strong>{preview.count} students</strong> from <strong>Class {preview.fromClass}</strong> to <strong>{preview.toClass === 'Graduated' ? 'Graduated' : `Class ${preview.toClass}`}</strong>.
            </p>
            <p className="text-gray-600 text-sm mb-1">Academic Year: <strong>{targetYear}</strong></p>
            <p className="text-gray-600 text-sm mb-5">Fee Action: <strong>{feeAction === 'reset' ? 'Reset Fee Structure' : 'Keep Previous Fee'}</strong></p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 mb-5">
              ⚠️ This operation uses a database transaction. If any student fails, <strong>all promotions will be rolled back</strong>.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkModal(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleBulkPromote} disabled={bulkLoading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {bulkLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Promoting...</> : <><CheckCircle className="w-4 h-4" /> Yes, Promote All</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Individual Confirmation Modal ─────────────────────────────────────── */}
      {showIndivModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-brand-dark">Confirm Promotion</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Promote <strong>{selectedStudent.name}</strong> from <strong>Class {selectedStudent.studentClass}</strong> to{' '}
              <strong>{CLASS_PROGRESSION[selectedStudent.studentClass] === 'Graduated' ? 'Graduated' : `Class ${CLASS_PROGRESSION[selectedStudent.studentClass]}`}</strong> ({indivYear})?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowIndivModal(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleIndivPromote} disabled={indivLoading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {indivLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
