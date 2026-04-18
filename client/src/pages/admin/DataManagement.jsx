import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Archive, Download, Trash2, RotateCcw, Search, Filter, ChevronLeft, ChevronRight,
  AlertTriangle, ShieldAlert, Clock, CheckSquare, Square, Users, FileDown,
  Eye, X, Info, RefreshCw, Database, Activity
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CLASSES = ['5', '6', '7', '8', '9', '10', '11', '12'];
const BOARDS = ['CBSE', 'ICSE', 'JAC'];
const YEARS = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i));

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 transition"
          placeholder="Search name, ID, mobile…"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <select
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40"
        value={filters.studentClass}
        onChange={e => onChange({ ...filters, studentClass: e.target.value })}
      >
        <option value="">All Classes</option>
        {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
      </select>
      <select
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40"
        value={filters.board}
        onChange={e => onChange({ ...filters, board: e.target.value })}
      >
        <option value="">All Boards</option>
        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      <select
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40"
        value={filters.year}
        onChange={e => onChange({ ...filters, year: e.target.value })}
      >
        <option value="">All Years</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button
        onClick={() => onChange({ search: '', studentClass: '', board: '', year: '' })}
        className="text-sm px-3 py-2 text-gray-500 hover:text-red-500 transition flex items-center gap-1"
      >
        <X className="w-3.5 h-3.5" /> Clear
      </button>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
      <div className="flex gap-2">
        <button
          disabled={pagination.page === 1}
          onClick={() => onPage(pagination.page - 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={pagination.page === pagination.pages}
          onClick={() => onPage(pagination.page + 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Archive Modal ────────────────────────────────────────────────────────────
function ArchiveModal({ selectedIds, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      toast.error('Archive reason must be at least 10 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/lifecycle/archive', { studentIds: selectedIds, reason: reason.trim() });
      toast.success(res.data.message);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Archive failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Archive {selectedIds.length} Student{selectedIds.length !== 1 ? 's' : ''}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Students will be moved from active to the archive collection.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Archive Reason <span className="text-red-400">*</span></label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              rows={3}
              placeholder="Minimum 10 characters required…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <p className={`text-xs mt-1 ${reason.length >= 10 ? 'text-green-500' : 'text-gray-400'}`}>
              {reason.length}/10 minimum characters
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              This action will move {selectedIds.length} student record(s) to the archive. They will no longer appear in the active student list but can be restored at any time.
            </p>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 10}
            className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Archiving…</> : <><Archive className="w-3.5 h-3.5" /> Confirm Archive</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal (3-step) ────────────────────────────────────────
function DeleteModal({ selectedIds, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const expectedText = `DELETE ${selectedIds.length}`;

  useEffect(() => {
    if (step === 3 && inputRef.current) inputRef.current.focus();
  }, [step]);

  const handleDelete = async () => {
    if (confirmText !== expectedText) return;
    setLoading(true);
    try {
      const res = await api.post('/lifecycle/delete', {
        archivedIds: selectedIds,
        confirmText,
      });
      toast.success(res.data.message);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Step indicator */}
        <div className="flex border-b border-gray-100">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${step >= s ? 'text-red-600 bg-red-50' : 'text-gray-300'}`}>
              Step {s}
            </div>
          ))}
        </div>

        {/* Step 1 — Warning */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Permanently Delete Students</h3>
                <p className="text-sm text-red-500 font-medium">This cannot be undone after 30 days.</p>
              </div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-red-700">⚠️ You are about to permanently delete {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''}.</p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                <li>Records enter a 30-day recovery window</li>
                <li>After 30 days, data is permanently erased</li>
                <li>Cloudinary photos will also be deleted</li>
                <li>This action is logged and audited</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={onClose} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => setStep(2)} className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
                I understand, continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Final warning before input */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl font-black text-red-200 mb-2">{selectedIds.length}</div>
              <p className="text-sm font-semibold text-gray-700">student record{selectedIds.length !== 1 ? 's' : ''} will enter the deletion window</p>
              <p className="text-xs text-gray-400 mt-1">Permanently erased after 30 days. Only SUPER_ADMIN can restore within this window.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 font-medium mb-2">In the next step, you must type exactly:</p>
              <code className="text-sm font-mono font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{expectedText}</code>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStep(1)} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">← Back</button>
              <button onClick={() => setStep(3)} className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
                I know the risk →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Typed confirmation */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700">
              Type <code className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-sm">{expectedText}</code> to confirm:
            </p>
            <input
              ref={inputRef}
              className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-colors ${
                confirmText === expectedText
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 focus:border-red-300'
              }`}
              placeholder={`Type: ${expectedText}`}
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmText === expectedText && handleDelete()}
            />
            {confirmText.length > 0 && confirmText !== expectedText && (
              <p className="text-xs text-red-500">
                ✗ Doesn't match. Expected: <strong>{expectedText}</strong>
              </p>
            )}
            {confirmText === expectedText && (
              <p className="text-xs text-green-600 font-medium">✓ Confirmation matched</p>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setStep(2); setConfirmText(''); }} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">← Back</button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== expectedText || loading}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing…</> : <><Trash2 className="w-3.5 h-3.5" /> Delete Permanently</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Active Students ─────────────────────────────────────────────────────
function ActiveStudentsTab({ adminRole }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', studentClass: '', board: '', year: '' });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = new URLSearchParams({ page, limit: 20, ...filters });
      Object.keys(filters).forEach(k => !filters[k] && params.delete(k));
      // Use status=Active to only show approved active students
      params.append('status', 'Active');
      const res = await api.get(`/admin/students?${params}`);
      setStudents(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map(s => s._id)));
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await api.post('/lifecycle/export', {
        collection: 'active',
        filters: {
          ...filters,
          studentIds: selected.size > 0 ? [...selected] : undefined,
        },
      }, { responseType: 'blob' });

      const classStr = filters.studentClass ? `Class${filters.studentClass}` : 'AllClasses';
      const boardStr = filters.board || 'AllBoards';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `students_export_${classStr}_${boardStr}_${dateStr}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed. SUPER_ADMIN only.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Active Students</h3>
          <p className="text-sm text-gray-500">Select students to archive or export data.</p>
        </div>
        <div className="flex gap-2">
          {adminRole === 'SUPER_ADMIN' && (
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Export {selected.size > 0 ? `(${selected.size})` : 'All'}
            </button>
          )}
          <button
            onClick={() => { if (selected.size === 0) { toast.error('Select at least one student'); return; } setShowArchiveModal(true); }}
            disabled={selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            Archive {selected.size > 0 ? `(${selected.size})` : 'Selected'}
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3">
                  <button onClick={toggleAll}>
                    {selected.size === students.length && students.length > 0
                      ? <CheckSquare className="w-4 h-4 text-purple-600" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                {['Student', 'ID', 'Class', 'Board', 'Batch', 'Year', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No active students found.</td></tr>
              ) : students.map(s => (
                <tr key={s._id} className={`border-b border-gray-50 transition-colors ${selected.has(s._id) ? 'bg-purple-50/40' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(s._id)}>
                      {selected.has(s._id)
                        ? <CheckSquare className="w-4 h-4 text-purple-600" />
                        : <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.mobile}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-purple-700">{s.studentId || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">Class {s.studentClass}</td>
                  <td className="px-4 py-3 text-gray-700">{s.board}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.batch ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.batch || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.academicYear || new Date(s.createdAt).getFullYear()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{s.registrationStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {showArchiveModal && (
        <ArchiveModal
          selectedIds={[...selected]}
          onClose={() => setShowArchiveModal(false)}
          onSuccess={fetchStudents}
        />
      )}
    </div>
  );
}

// ─── Tab: Archived Students ───────────────────────────────────────────────────
function ArchivedStudentsTab({ adminRole }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', studentClass: '', board: '', year: '' });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/lifecycle/archive?${params}`);
      setStudents(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load archived students');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s._id)));
  };

  const handleRestore = async () => {
    if (selected.size === 0) { toast.error('Select at least one record'); return; }
    setRestoring(true);
    try {
      const res = await api.post('/lifecycle/archive/restore', { archivedIds: [...selected] });
      const { data } = res.data;
      if (data.failed?.length > 0) {
        data.failed.forEach(f => toast.error(`${f.name}: ${f.reason}`));
      }
      if (data.restored?.length > 0) {
        toast.success(`${data.restored.length} student(s) restored successfully`);
      }
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await api.post('/lifecycle/export', {
        collection: 'archived',
        filters: { ...filters },
      }, { responseType: 'blob' });

      const classStr = filters.studentClass ? `Class${filters.studentClass}` : 'AllClasses';
      const boardStr = filters.board || 'AllBoards';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `archived_export_${classStr}_${boardStr}_${dateStr}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Archived data exported!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed. SUPER_ADMIN only.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Archived Students</h3>
          <p className="text-sm text-gray-500">Manage archived records — restore or schedule for deletion.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {adminRole === 'SUPER_ADMIN' && (
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Export Archive
            </button>
          )}
          <button
            onClick={handleRestore}
            disabled={restoring || selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Restore {selected.size > 0 ? `(${selected.size})` : 'Selected'}
          </button>
          {adminRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => { if (selected.size === 0) { toast.error('Select records first'); return; } setShowDeleteModal(true); }}
              disabled={selected.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selected.size > 0 ? `(${selected.size})` : 'Selected'}
            </button>
          )}
        </div>
      </div>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-amber-50/60">
                <th className="px-4 py-3">
                  <button onClick={toggleAll}>
                    {selected.size === students.length && students.length > 0
                      ? <CheckSquare className="w-4 h-4 text-amber-600" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                {['Student', 'ID', 'Class/Board', 'Archived By', 'Archived On', 'Reason'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-amber-50 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No archived students.</td></tr>
              ) : students.map(s => (
                <tr key={s._id} className={`border-b border-gray-50 transition-colors ${selected.has(s._id) ? 'bg-amber-50/40' : 'hover:bg-amber-50/20'}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(s._id)}>
                      {selected.has(s._id)
                        ? <CheckSquare className="w-4 h-4 text-amber-600" />
                        : <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.mobile}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-amber-700">{s.studentId || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700">Class {s.studentClass}</span>
                    <span className="text-gray-400"> · {s.board}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.archivedBy}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.archivedAt ? new Date(s.archivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={s.archiveReason}>
                    {s.archiveReason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {showDeleteModal && (
        <DeleteModal
          selectedIds={[...selected]}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={fetchStudents}
        />
      )}
    </div>
  );
}

// ─── Tab: Deleted / Recovery Window ──────────────────────────────────────────
function DeletedStudentsTab({ adminRole }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', studentClass: '', board: '', year: '' });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [restoring, setRestoring] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/lifecycle/deleted?${params}`);
      setRecords(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load deletion queue');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map(r => r._id)));
  };

  const handleRestore = async () => {
    if (selected.size === 0) { toast.error('Select at least one record'); return; }
    setRestoring(true);
    try {
      const res = await api.post('/lifecycle/deleted/restore', { archivedIds: [...selected] });
      toast.success(res.data.message);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const getDaysColor = (days) => {
    if (days === 0) return 'bg-red-100 text-red-700 border border-red-200';
    if (days <= 5) return 'bg-red-50 text-red-600';
    if (days <= 10) return 'bg-orange-50 text-orange-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-5">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">30-Day Recovery Window</p>
          <p className="text-xs text-red-600 mt-0.5">Records here are scheduled for permanent deletion. You have up to 30 days to restore them. After the window closes, data cannot be recovered.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Deletion Queue</h3>
          <p className="text-sm text-gray-500">Soft-deleted records with remaining recovery window.</p>
        </div>
        <div className="flex gap-2">
          {adminRole === 'SUPER_ADMIN' && (
            <button
              onClick={handleRestore}
              disabled={restoring || selected.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Restore {selected.size > 0 ? `(${selected.size})` : 'Selected'}
            </button>
          )}
        </div>
      </div>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-red-50/60">
                {adminRole === 'SUPER_ADMIN' && (
                  <th className="px-4 py-3">
                    <button onClick={toggleAll}>
                      {selected.size === records.length && records.length > 0
                        ? <CheckSquare className="w-4 h-4 text-red-600" />
                        : <Square className="w-4 h-4 text-gray-400" />}
                    </button>
                  </th>
                )}
                {['Student', 'Class/Board', 'Deleted By', 'Deleted On', 'Days Left', 'Archive Reason'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-red-50 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <CheckSquare className="w-8 h-8 text-green-300" />
                    <p>No records in the deletion queue. All data is safe.</p>
                  </div>
                </td></tr>
              ) : records.map(r => (
                <tr key={r._id} className={`border-b border-gray-50 transition-colors ${selected.has(r._id) ? 'bg-red-50/40' : 'hover:bg-red-50/10'}`}>
                  {adminRole === 'SUPER_ADMIN' && (
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(r._id)}>
                        {selected.has(r._id)
                          ? <CheckSquare className="w-4 h-4 text-red-600" />
                          : <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.studentId || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">Class {r.studentClass} · {r.board}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.deletedBy}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.deletedAt ? new Date(r.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${getDaysColor(r.remainingDays)}`}>
                      <Clock className="w-3 h-3" />
                      {r.remainingDays === 0 ? 'Expires today' : `${r.remainingDays}d left`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate" title={r.archiveReason}>
                    {r.archiveReason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  );
}

// ─── Tab: Lifecycle Audit Logs ────────────────────────────────────────────────
function LifecycleLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lifecycle/logs?page=${page}&limit=30`);
      setLogs(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load lifecycle logs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionBadge = (action) => {
    const map = {
      archived: 'bg-amber-100 text-amber-700',
      restore_from_archive: 'bg-blue-100 text-blue-700',
      soft_deleted: 'bg-red-100 text-red-700',
      restored_from_delete: 'bg-green-100 text-green-700',
      purged: 'bg-gray-200 text-gray-700',
    };
    const label = {
      archived: 'Archived',
      restore_from_archive: 'Restored',
      soft_deleted: 'Soft Deleted',
      restored_from_delete: 'Recovered',
      purged: 'Purged',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[action] || 'bg-gray-100 text-gray-600'}`}>
        {label[action] || action}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Lifecycle Audit Logs</h3>
        <p className="text-sm text-gray-500">Immutable record of all archive, delete, and restore actions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Student', 'Action', 'Performed By', 'Role', 'Date & Time', 'IP Address', 'Note'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-50 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No lifecycle events recorded yet.</td></tr>
              ) : logs.map((log, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{log.name}</p>
                    <p className="text-xs font-mono text-gray-400">{log.studentId}</p>
                  </td>
                  <td className="px-4 py-3">{actionBadge(log.action)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.performedBy}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.performedByRole === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {log.performedByRole || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.performedAt ? new Date(log.performedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={log.note}>{log.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  );
}

// ─── Main DataManagement Page ─────────────────────────────────────────────────
export default function DataManagement({ adminRole }) {
  const [activeTab, setActiveTab] = useState('active');

  const tabs = [
    { id: 'active', label: 'Active Students', icon: Users, color: 'text-purple-600', activeBg: 'bg-purple-50 border-purple-300' },
    { id: 'archived', label: 'Archived Students', icon: Archive, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-300' },
    { id: 'deleted', label: 'Recovery Window', icon: Clock, color: 'text-red-600', activeBg: 'bg-red-50 border-red-300' },
    { id: 'logs', label: 'Audit Logs', icon: Activity, color: 'text-gray-600', activeBg: 'bg-gray-100 border-gray-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Data Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Archive, export, and safely manage student data lifecycle.</p>
        </div>
      </div>

      {/* Role badge */}
      {adminRole === 'SUPER_ADMIN' ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl w-fit">
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-purple-700">SUPER_ADMIN — Full access: archive, export, delete, restore</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl w-fit">
          <Info className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">ADMIN — You can archive students. Export and delete require SUPER_ADMIN.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`data-mgmt-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                isActive
                  ? `${tab.activeBg} ${tab.color}`
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'active' && <ActiveStudentsTab adminRole={adminRole} />}
        {activeTab === 'archived' && <ArchivedStudentsTab adminRole={adminRole} />}
        {activeTab === 'deleted' && <DeletedStudentsTab adminRole={adminRole} />}
        {activeTab === 'logs' && <LifecycleLogsTab />}
      </div>
    </div>
  );
}
