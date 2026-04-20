import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Lock, Unlock, Trash2, Upload, Download,
  ChevronLeft, Eye, Send, X, CheckCircle, AlertCircle, FileSpreadsheet,
  ClipboardList, Users, Calendar, Award
} from 'lucide-react';
import { fetchBoardClassMap, getAllowedBoardsForClass } from '../../utils/boardConstraints';

const BATCHES = ['5', '6', '7', '8', '9', '10', '11', '12'];
const BOARDS = ['CBSE', 'ICSE', 'JAC', 'ALL'];
const SUBJECTS = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 
  'English', 'Hindi', 'Social Science', 'Computer Science',
  'Accountancy', 'Business Studies', 'Economics'
];

const COMMERCE_SUBJECTS = ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English', 'Computer Science'];
const SCHOOL_SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science'];

function getPercentageColor(percentage) {
  if (percentage === null || percentage === undefined) return 'bg-gray-100 text-gray-500';
  if (percentage >= 75) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (percentage >= 50) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

function getRowBg(percentage, isAbsent) {
  if (isAbsent) return 'bg-gray-50/80';
  if (percentage === null || percentage === undefined) return '';
  if (percentage >= 75) return 'bg-emerald-50/40';
  if (percentage >= 50) return 'bg-amber-50/40';
  return 'bg-red-50/40';
}

// ─── Create Test Modal ──────────────────────────────────────────────
function CreateTestModal({ onClose, onCreated, branches, defaultBranch }) {
  const [form, setForm] = useState({ 
    testName: '', 
    subject: '', 
    date: '', 
    totalMarks: '', 
    batch: '', 
    board: 'ALL',
    branch: defaultBranch && defaultBranch !== '' ? defaultBranch : '',
    isAllBranches: false,
    overrideReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [allowedBoards, setAllowedBoards] = useState([]);
  const [configMap, setConfigMap] = useState(null);
  const [requiresOverride, setRequiresOverride] = useState(false);

  useEffect(() => {
    fetchBoardClassMap().then(setConfigMap);
  }, []);

  useEffect(() => {
    if (configMap && form.batch) {
      const allowed = getAllowedBoardsForClass(configMap, form.batch);
      setAllowedBoards(allowed);
      
      // If "ALL" is selected, we check if ALL is generally allowed or if we need to show override
      // Usually "ALL" means all boards for that class. 
      // If form.board is not in allowed list (and not ALL), trigger override prompt
      if (form.board !== 'ALL' && !allowed.includes(form.board)) {
        setRequiresOverride(true);
      } else {
        setRequiresOverride(false);
      }
    } else {
      setAllowedBoards(BOARDS);
      setRequiresOverride(false);
    }
  }, [configMap, form.batch, form.board]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/weekly-tests', form);
      toast.success('Test created successfully!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-brand-dark text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Create Weekly Test
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Test Name</label>
            <input className="input-field" placeholder="e.g. Weekly Test 5" value={form.testName}
              onChange={(e) => setForm({ ...form, testName: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Branch</label>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={form.branch} 
                  onChange={(e) => setForm({ ...form, branch: e.target.value, isAllBranches: false })} 
                  disabled={form.isAllBranches} required={!form.isAllBranches}>
                  <option value="">Select Branch</option>
                  {(branches || []).map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 px-3 border border-gray-100 rounded-xl bg-gray-50/50">
                  <input type="checkbox" id="allBranches" checked={form.isAllBranches}
                    onChange={(e) => setForm({ ...form, isAllBranches: e.target.checked, branch: e.target.checked ? '' : form.branch })}
                    className="w-4 h-4 text-primary rounded focus:ring-primary" />
                  <label htmlFor="allBranches" className="text-xs font-bold text-gray-500 cursor-pointer">All</label>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Board</label>
              <select className="input-field" value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} required>
                {BOARDS.map((b) => {
                  const isAllowed = b === 'ALL' || allowedBoards.includes(b);
                  return (
                    <option key={b} value={b} className={!isAllowed ? 'text-red-500 font-bold' : ''}>
                      {b} {!isAllowed ? '(Invalid)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="label">Batch (Class)</label>
              <select className="input-field" value={form.batch} onChange={(e) => {
                 let updatedBoard = form.board;
                 const newBatch = e.target.value;
                 if (newBatch && ['5','6','7','8','9','10'].includes(newBatch) && updatedBoard === 'JAC') updatedBoard = 'CBSE';
                 if (newBatch && ['11','12'].includes(newBatch) && updatedBoard === 'ICSE') updatedBoard = 'CBSE';
                 setForm({ ...form, batch: newBatch, subject: '', board: updatedBoard });
              }} required>
                <option value="">Select Class</option>
                {BATCHES.filter(batch => {
                   if (form.board === 'ICSE') return ['6','7','8','9','10'].includes(batch);
                   if (form.board === 'JAC') return ['11','12'].includes(batch);
                   return true;
                }).map((b) => <option key={b} value={b}>Class {b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Subject</label>
            <select className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
              <option value="">Select Subject</option>
              {form.batch && (['11', '12'].includes(form.batch) ? COMMERCE_SUBJECTS : SCHOOL_SUBJECTS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              {!form.batch && <option disabled>Select class first</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Total Marks</label>
              <input type="number" className="input-field" placeholder="e.g. 50" min="1" value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} required />
            </div>
          </div>

          {requiresOverride && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-pulse-slow">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <AlertCircle className="w-4 h-4" /> Validation Override Required
              </div>
              <p className="text-xs text-red-600">
                The selected Board-Class combination is generally not allowed. To proceed, you must provide a reason for this override.
              </p>
              <textarea 
                className="input-field text-sm bg-white" 
                placeholder="Why is this combination being allowed? (Log required)"
                value={form.overrideReason}
                onChange={(e) => setForm({ ...form, overrideReason: e.target.value })}
                required={requiresOverride}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (requiresOverride && !form.overrideReason)} 
            className="btn-primary w-full py-3 disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating...' : (requiresOverride ? '⚠️ Confirm & Create Test' : 'Create Test')}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Import Summary & Preview Modal ─────────────────────────────────
function ImportSummaryModal({ data, onClose, onConfirm, loading }) {
  if (!data) return null;
  const isPreview = data.isDryRun;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-brand-dark text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {isPreview ? 'Import Preview (Dry Run)' : 'Import Summary'}
          </h3>
          <button onClick={onClose} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-50"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5">
          {isPreview && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              This is a preview. No data has been saved to the database yet. Review the details below.
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-3xl font-bold text-emerald-700">{data.successCount}</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wider">{isPreview ? 'Valid Rows' : 'Successful'}</div>
            </div>
            <div className="flex-1 p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <div className="text-3xl font-bold text-red-700">{data.failedCount}</div>
              <div className="text-xs font-semibold text-red-600 mt-1 uppercase tracking-wider">{isPreview ? 'Invalid Rows' : 'Failed'}</div>
            </div>
          </div>

          {data.errors?.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Errors
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.errors.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100 text-sm">
                    <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">Row {f.row}</span>
                    <div>
                      <span className="font-medium text-brand-dark">{f.studentId}</span>
                      {f.studentName && <span className="text-gray-500"> — {f.studentName}</span>}
                      <p className="text-red-600 text-xs mt-0.5 font-semibold">{f.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.preview?.length > 0 && isPreview && (
            <div>
              <h4 className="font-semibold text-emerald-700 text-sm mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Valid Data to Import
              </h4>
              <div className="text-xs text-brand-dark space-y-1 max-h-48 overflow-y-auto border border-emerald-100 rounded-xl p-2 bg-emerald-50/30">
                {data.preview.map((s, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded-lg bg-white border border-emerald-100/50 shadow-sm">
                    <span className="font-semibold">{s.studentId}</span>
                    <span className="text-gray-400">•</span>
                    <span className="truncate flex-1">{s.studentName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${s.action === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {s.action}
                    </span>
                    <span className="ml-auto font-bold text-brand-dark tabular-nums bg-gray-50 px-2 rounded border border-gray-100">
                      {s.marksObtained} <span className="text-gray-400">/ {s.maxMarks}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-3">
          {isPreview ? (
            <>
              <button onClick={onClose} disabled={loading} className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button onClick={() => onConfirm(data.file)} disabled={loading || data.successCount === 0} className="btn-primary flex-1 py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? 'Importing...' : <><CheckCircle className="w-4 h-4" /> Confirm & Import {data.successCount} Rows</>}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn-primary w-full py-2.5">Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Test Detail View (marks table + actions) ───────────────────────
function TestDetailView({ testId, onBack }) {
  const [test, setTest] = useState(null);
  const [results, setResults] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markForm, setMarkForm] = useState({ studentId: '', marks: '' });
  const [savingMark, setSavingMark] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importData, setImportData] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/weekly-tests/${testId}`);
      setTest(res.data.data.test);
      setResults(res.data.data.results);
      setEligibleStudents(res.data.data.eligibleStudents || res.data.data.pendingStudents || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load test details');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleSingleMark = async (e) => {
    e.preventDefault();
    if (!markForm.studentId || (!markForm.marks && markForm.marks !== '0')) {
      toast.error('Select student and enter marks');
      return;
    }
    setSavingMark(true);
    try {
      await api.post(`/weekly-tests/${testId}/marks`, {
        studentId: markForm.studentId,
        marksObtained: markForm.marks,
      });
      toast.success('Marks saved!');
      setMarkForm({ studentId: '', marks: '' });
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSavingMark(false);
    }
  };

  const handleEditMark = async (studentId, newMarks) => {
    try {
      await api.post(`/weekly-tests/${testId}/marks`, {
        studentId,
        marksObtained: newMarks,
      });
      toast.success('Marks updated!');
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update marks');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('weeklyTestId', testId);
    setUploading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await api.post(`/admin/import/excel?dryRun=true`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      // Attach the file object to the preview data so we can reuse it for the real import
      setImportData({ ...res.data, file });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Preview generation failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('weeklyTestId', testId);
    setUploading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const res = await api.post(`/admin/import/excel?dryRun=false`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      toast.success('Import completed successfully!');
      setImportData({ ...res.data, isDryRun: false });
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Final import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(`/weekly-tests/${testId}/template`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks_template_class${test.batch}_${test.subject}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleToggleLock = async () => {
    try {
      const res = await api.patch(`/weekly-tests/${testId}/lock`);
      toast.success(res.data.message);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle lock');
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish results? Students will be notified.')) return;
    try {
      const res = await api.post(`/weekly-tests/${testId}/publish`);
      toast.success(res.data.message);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    }
  };

  const handleDeleteTest = async () => {
    if (!window.confirm('Are you sure you want to delete this test? It will be moved to the Recycle Bin.')) return;
    try {
      await api.delete(`/weekly-tests/${testId}`);
      toast.success('Test moved to Recycle Bin');
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete test');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="card p-6 animate-pulse h-16" />)}
      </div>
    );
  }

  if (!test) {
    return <div className="text-center py-16 text-gray-400">Test not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Import Summary Modal */}
      {importData && (
        <ImportSummaryModal 
          data={importData} 
          loading={uploading}
          onClose={() => setImportData(null)} 
          onConfirm={handleConfirmImport} 
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-primary/10 transition-colors mt-1">
          <ChevronLeft className="w-5 h-5 text-brand-dark" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-brand-dark">{test.testName}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">{test.subject}</span>
            <span className="text-xs bg-brand-bg text-brand-dark px-3 py-1 rounded-full font-semibold">Class {test.batch}</span>
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-100">{test.board}</span>
            <span className="text-xs text-gray-400">{new Date(test.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="text-xs font-bold text-gray-500">Total: {test.totalMarks}</span>
            {test.isLocked && (
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
            {test.isPublished && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                <Send className="w-3 h-3" /> Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">
        <button onClick={handleToggleLock}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${test.isLocked
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          }`}>
          {test.isLocked ? <><Unlock className="w-4 h-4" /> Unlock Test</> : <><Lock className="w-4 h-4" /> Lock Test</>}
        </button>
        <button onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all">
          <Download className="w-4 h-4" /> Download Template
        </button>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${test.isLocked
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
        }`}>
          <Upload className="w-4 h-4" /> {uploading ? 'Importing...' : 'Upload Excel'}
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={test.isLocked || uploading} />
        </label>
        {!test.isPublished && (
          <button onClick={handlePublish}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-brand text-white hover:shadow-glass transition-all ml-auto">
            <Send className="w-4 h-4" /> Publish Results
          </button>
        )}
        <button onClick={handleDeleteTest}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all ${test.isPublished ? 'ml-auto' : ''}`}>
          <Trash2 className="w-4 h-4" /> Delete Test
        </button>
      </div>

      {/* Manual Entry Form */}
      {!test.isLocked && (
        <form onSubmit={handleSingleMark} className="card p-5">
          <h4 className="font-semibold text-brand-dark text-sm mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add / Update Marks
          </h4>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-48">
              <label className="label text-xs">Student</label>
              <select className="input-field py-2 text-sm" value={markForm.studentId}
                onChange={(e) => setMarkForm({ ...markForm, studentId: e.target.value })}>
                <option value="">Select Student</option>
                {/* Show eligible students first, then existing */}
                {eligibleStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.studentId ? `[${s.studentId}] ` : ''}{s.name} (pending)
                  </option>
                ))}
                {results.map((r) => (
                  <option key={r.studentId?._id} value={r.studentId?._id}>
                    {r.studentId?.studentId ? `[${r.studentId.studentId}] ` : ''}{r.studentId?.name} (update: {r.marksObtained})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="label text-xs">Marks (or AB)</label>
              <input className="input-field py-2 text-sm" placeholder={`0-${test.totalMarks} or AB`}
                value={markForm.marks} onChange={(e) => setMarkForm({ ...markForm, marks: e.target.value })} />
            </div>
            <button type="submit" disabled={savingMark} className="btn-primary py-2 px-5 text-sm disabled:opacity-60">
              {savingMark ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-semibold text-brand-dark flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Student Results ({results.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-bg">
                {['#', 'Student ID', 'Name', 'Marks', 'Percentage', 'Status', !test.isLocked && 'Actions'].filter(Boolean).map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={test.isLocked ? 6 : 7} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    No marks entered yet
                  </td>
                </tr>
              ) : results.map((r, i) => (
                <tr key={r._id} className={`transition-colors ${getRowBg(r.percentage, r.isAbsent)}`}>
                  <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.studentId?.studentId || '—'}</td>
                  <td className="px-4 py-3 font-medium text-brand-dark">{r.studentId?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 font-bold text-brand-dark">
                    {r.isAbsent ? (
                      <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold">AB</span>
                    ) : (
                      <span>{r.marksObtained} / {test.totalMarks}</span>
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
                  {!test.isLocked && (
                    <td className="px-4 py-3">
                      <EditableMarksCell
                        currentMarks={r.marksObtained}
                        totalMarks={test.totalMarks}
                        onSave={(newMarks) => handleEditMark(r.studentId?._id, newMarks)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Editable Marks Cell ─────────────────────────────────────
function EditableMarksCell({ currentMarks, totalMarks, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentMarks));

  const handleSave = () => {
    if (value.trim() === String(currentMarks)) {
      setEditing(false);
      return;
    }
    onSave(value.trim());
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => { setValue(String(currentMarks)); setEditing(true); }}
        className="text-xs text-primary hover:text-primary-700 underline underline-offset-2 font-medium">
        Edit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input className="w-16 px-2 py-1 border border-primary/30 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        value={value} onChange={(e) => setValue(e.target.value)} placeholder={`0-${totalMarks}`}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus />
      <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-800">
        <CheckCircle className="w-4 h-4" />
      </button>
      <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main Admin Weekly Tests Page ───────────────────────────────────
export default function AdminWeeklyTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBoard, setFilterBoard] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        setBranches(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };
    fetchBranches();
  }, []);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = [];
      if (filterBatch) params.push(`batch=${filterBatch}`);
      if (filterSubject) params.push(`subject=${filterSubject}`);
      if (filterBoard) params.push(`board=${filterBoard}`);
      if (filterBranch) params.push(`branch=${filterBranch}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const res = await api.get(`/weekly-tests${query}`);
      setTests(res.data.data || []);
    } catch {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [filterBatch, filterSubject, filterBoard]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  // Detail view
  if (selectedTest) {
    return (
      <TestDetailView
        testId={selectedTest}
        onBack={() => { setSelectedTest(null); fetchTests(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Modal */}
      {showCreate && <CreateTestModal 
        onClose={() => setShowCreate(false)} 
        onCreated={fetchTests} 
        branches={branches} 
        defaultBranch={filterBranch}
      />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-dark">Weekly Tests</h2>
          <p className="text-gray-500 text-sm mt-1">Create, manage, and publish weekly test results</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Test
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <select className="bg-transparent text-sm outline-none text-brand-dark font-medium min-w-28"
            value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Award className="w-4 h-4 text-gray-400" />
          <select className="bg-transparent text-sm outline-none text-brand-dark font-medium min-w-28"
            value={filterBoard} onChange={(e) => setFilterBoard(e.target.value)}>
            <option value="">All Boards</option>
            {BOARDS.filter(b => {
              if (filterBatch && ['5', '6', '7', '8', '9', '10'].includes(filterBatch) && b === 'JAC') return false;
              if (filterBatch && ['11', '12'].includes(filterBatch) && b === 'ICSE') return false;
              return true;
            }).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Users className="w-4 h-4 text-gray-400" />
          <select className="bg-transparent text-sm outline-none text-brand-dark font-medium min-w-28"
            value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
            <option value="">All Classes</option>
            {BATCHES.map((b) => <option key={b} value={b}>Class {b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-primary/10 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="w-4 h-4 text-gray-400" />
          <select className="bg-transparent text-sm outline-none text-brand-dark font-medium min-w-28"
            value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card p-6 animate-pulse h-40" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-500 font-semibold text-lg">No tests found</h3>
          <p className="text-gray-400 text-sm mt-1">Create your first weekly test to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <div key={t._id} className="card p-5 cursor-pointer group" onClick={() => setSelectedTest(t._id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  {t.isLocked && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                  {t.isPublished && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Published
                    </span>
                  )}
                </div>
              </div>
              <h4 className="font-semibold text-brand-dark group-hover:text-primary transition-colors">{t.testName}</h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">{t.subject}</span>
                <span className="text-[10px] bg-brand-bg text-brand-dark px-2 py-0.5 rounded-full font-bold uppercase">Class {t.batch}</span>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-100">{t.board}</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  {t.resultCount || 0} entries
                </div>
                <span className="text-xs font-bold text-brand-dark">{t.totalMarks} marks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
