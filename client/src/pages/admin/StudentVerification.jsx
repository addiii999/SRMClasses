import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Users, CheckCircle, XCircle, Search, Calendar,
  GraduationCap, ShieldCheck, ArrowRight, Clock,
  Eye, Package, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, Lock, Unlock, Trash2, RotateCcw, Edit3,
  BookOpen, Phone, MapPin, School, UserCheck, UserX
} from 'lucide-react';

import { fetchBoardClassMap, getAllowedBoardsForClass } from '../../utils/boardConstraints';

const BATCH_OPTIONS = ['Foundation Batch', 'Advance Batch', 'Core Batch', 'Commerce Batch'];
const BOARDS = ['CBSE', 'ICSE', 'JAC'];
const CLASSES = ['5','6','7','8','9','10','11','12'];

const authHeader = () => ({ Authorization: `Bearer ${sessionStorage.getItem('srmAdminToken')}` });

function StatusBadge({ status }) {
  const map = {
    Active: 'bg-green-100 text-green-700 border-green-200',
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Rejected: 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status?.toUpperCase()}
    </span>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function StudentDetailModal({ student, branches, onClose, onRefresh, adminRole }) {
  const [tab, setTab] = useState('info');
  const [editForm, setEditForm] = useState({
    name: student.name || '',
    studentClass: student.studentClass || '',
    board: student.board || 'CBSE',
    branch: student.branch?._id || student.branch || '',
    parentName: student.parentName || '',
    parentContact: student.parentContact || '',
    schoolName: student.schoolName || '',
    address: student.address || '',
    overrideReason: '',
  });
  const [batchForm, setBatchForm] = useState(student.batch || '');
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [overrideModal, setOverrideModal] = useState({ show: false, action: null, message: '' });

  const executeUpdate = async (override = false) => {
    setSaving(true);
    setOverrideModal({ show: false, action: null, message: '' });
    try {
      const payload = { ...editForm };
      if (override) {
        payload.overrideBoardClassValidation = true;
        if (!payload.overrideReason) return toast.error('Please provide a reason for override');
      }
      await api.put(`/admin/students/${student._id}`, payload, { headers: authHeader() });
      toast.success('Student updated successfully');
      onRefresh();
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_BOARD_CLASS_COMBINATION' && !override) {
        setOverrideModal({
          show: true,
          message: err.response.data.message,
          action: () => executeUpdate(true)
        });
      } else {
        toast.error(err.response?.data?.message || 'Update failed');
      }
    } finally {
      if (!override) setSaving(false);
    }
  };

  const handleUpdateField = () => executeUpdate(false);

  const handleAssignBatch = async () => {
    if (!batchForm) return toast.error('Please select a batch');
    setAssigning(true);
    try {
      await api.post(`/admin/students/${student._id}/assign-batch`, { batch: batchForm }, { headers: authHeader() });
      toast.success(`Assigned to ${batchForm}`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Batch assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleResetBoardCount = async () => {
    if (!window.confirm('Reset board change count to 0?')) return;
    try {
      await api.post(`/admin/students/${student._id}/reset-board-count`, {}, { headers: authHeader() });
      toast.success('Board change count reset to 0');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Reject this student?')) return;
    setRejecting(true);
    try {
      await api.put(`/admin/students/reject/${student._id}`, { reason: rejectReason }, { headers: authHeader() });
      toast.success('Student rejected');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setRejecting(false);
    }
  };

  const TABS = [
    { id: 'info', label: 'Information' },
    { id: 'edit', label: 'Edit Fields' },
    { id: 'batch', label: 'Batch' },
    { id: 'history', label: 'History' },
    { id: 'audit', label: 'Audit Log' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {student.name?.[0]}
            </div>
            <div>
              <h3 className="font-bold text-brand-dark">{student.name}</h3>
              <div className="flex items-center gap-2">
                {student.studentId && <span className="text-xs text-primary font-mono font-semibold">{student.studentId}</span>}
                <StatusBadge status={student.registrationStatus} />
                {!student.batch && student.registrationStatus === 'Active' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-100 text-orange-600 border-orange-200">UNASSIGNED BATCH</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Info Tab ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Mobile', value: student.mobile, icon: <Phone className="w-3.5 h-3.5" /> },
                  { label: 'Email', value: student.email, icon: <GraduationCap className="w-3.5 h-3.5" /> },
                  { label: 'Class', value: `Class ${student.studentClass}`, icon: <BookOpen className="w-3.5 h-3.5" /> },
                  { label: 'Board', value: student.board, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                  { label: 'Branch', value: student.branch?.name || '—', icon: <MapPin className="w-3.5 h-3.5" /> },
                  { label: 'Batch', value: student.batch || 'Unassigned', icon: <Package className="w-3.5 h-3.5" /> },
                  { label: 'Board Changes Used', value: `${student.boardChangeCount || 0} / 3`, icon: <RotateCcw className="w-3.5 h-3.5" /> },
                  { label: 'Registered', value: new Date(student.createdAt).toLocaleDateString('en-IN'), icon: <Calendar className="w-3.5 h-3.5" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase mb-1">{icon}{label}</div>
                    <p className="text-brand-dark text-sm font-semibold">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Parent Contact — visible in detail view only */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Parent Contact (Admin Only)</p>
                <p className="text-amber-800 font-semibold text-sm">{student.parentContact || '—'}</p>
                {student.parentName && <p className="text-amber-600 text-xs mt-0.5">Parent: {student.parentName}</p>}
              </div>

              {student.schoolName && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">School</p>
                  <p className="text-brand-dark text-sm">{student.schoolName}</p>
                </div>
              )}

              {student.address && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Address</p>
                  <p className="text-brand-dark text-sm">{student.address}</p>
                </div>
              )}

              {/* Reject action for active/pending */}
              {student.registrationStatus !== 'Rejected' && (
                <div className="border border-red-100 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-red-600">Rejection</p>
                  <input className="input-field text-sm" placeholder="Rejection reason (optional)"
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <button onClick={handleReject} disabled={rejecting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-200 disabled:opacity-60">
                    <UserX className="w-4 h-4" /> {rejecting ? 'Rejecting...' : 'Reject Registration'}
                  </button>
                </div>
              )}

              {/* SUPER_ADMIN: reset board count */}
              {adminRole === 'SUPER_ADMIN' && (
                <button onClick={handleResetBoardCount}
                  className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-800 font-semibold transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Board Change Count
                </button>
              )}
            </div>
          )}

          {/* ── Edit Fields Tab ── */}
          {tab === 'edit' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-blue-50 rounded-xl p-3 border border-blue-100">
                ⚡ All changes are logged to the audit trail automatically.
              </p>
              {[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'parentName', label: 'Parent Name', type: 'text' },
                { key: 'parentContact', label: 'Parent Contact', type: 'text' },
                { key: 'schoolName', label: 'School Name', type: 'text' },
                { key: 'address', label: 'Address', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type={type} className="input-field" value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Board</label>
                  <select className="input-field" value={editForm.board}
                    onChange={e => setEditForm({ ...editForm, board: e.target.value, studentClass: '' })}>
                    <option value="">Select Board</option>
                    {Object.keys(student.boardClassMap || {}).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Class</label>
                  <select className="input-field" value={editForm.studentClass}
                    onChange={e => setEditForm({ ...editForm, studentClass: e.target.value })}>
                    <option value="">Select</option>
                    {(student.boardClassMap?.[editForm.board] || ['5','6','7','8','9','10','11','12']).map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Branch</label>
                <select className="input-field" value={editForm.branch} onChange={e => setEditForm({ ...editForm, branch: e.target.value })}>
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <button onClick={handleUpdateField} disabled={saving}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Edit3 className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          )}

          {overrideModal.show && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-6 rounded-3xl">
              <div className="bg-white border border-red-100 shadow-xl rounded-2xl w-full p-6 text-center animate-in fade-in zoom-in duration-200">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h4 className="font-bold text-brand-dark mb-2">Override Constraint</h4>
                <p className="text-[11px] text-gray-500 mb-4">{overrideModal.message}</p>
                <div className="mb-4 text-left">
                  <label className="text-[10px] font-bold text-red-600 uppercase mb-1 block">Override Reason (Audit Log)</label>
                  <textarea 
                    className="input-field text-xs bg-gray-50 h-20" 
                    placeholder="Provide justification for this mismatch..."
                    value={editForm.overrideReason}
                    onChange={e => setEditForm({...editForm, overrideReason: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOverrideModal({ show: false })} className="btn-ghost flex-1 text-xs">Cancel</button>
                  <button 
                    disabled={!editForm.overrideReason}
                    onClick={overrideModal.action} 
                    className="btn-primary bg-red-500 hover:bg-red-600 border-red-600 flex-1 text-xs disabled:opacity-50"
                  >
                    Force Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Batch Tab ── */}
          {tab === 'batch' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Current Batch</p>
                <p className={`font-bold text-sm mt-1 ${student.batch ? 'text-brand-dark' : 'text-orange-500'}`}>
                  {student.batch || 'Unassigned'}
                </p>
              </div>
              <div>
                <label className="label">Assign Batch</label>
                <select className="input-field" value={batchForm} onChange={e => setBatchForm(e.target.value)}>
                  <option value="">Select Batch</option>
                  {BATCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• <strong>Foundation Batch</strong> — CBSE only, Class 5–10</p>
                <p>• <strong>Advance Batch</strong> — ICSE only, Class 6–10</p>
                <p>• <strong>Core Batch</strong> — CBSE & ICSE, Class 9–10 (Math/Science)</p>
                <p>• <strong>Commerce Batch</strong> — CBSE & ICSE, Class 11–12</p>
              </div>
              <button onClick={handleAssignBatch} disabled={assigning || !batchForm}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                {assigning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning...</> : <><Package className="w-4 h-4" /> Assign Batch</>}
              </button>
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <div className="space-y-3">
              {(student.profileHistory?.length === 0 || !student.profileHistory) ? (
                <p className="text-gray-400 text-sm text-center py-8">No profile history yet</p>
              ) : (
                [...(student.profileHistory || [])].reverse().map((h, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark text-xs capitalize">{h.field}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.changedBy === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {h.changedBy?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-red-500 line-through">{h.oldValue?.toString() || 'empty'}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-green-600 font-semibold">{h.newValue?.toString() || 'empty'}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(h.changedAt).toLocaleString('en-IN')}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Audit Log Tab ── */}
          {tab === 'audit' && (
            <div className="space-y-3">
              {(student.adminAuditLog?.length === 0 || !student.adminAuditLog) ? (
                <p className="text-gray-400 text-sm text-center py-8">No admin actions logged</p>
              ) : (
                [...(student.adminAuditLog || [])].reverse().map((log, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark text-xs capitalize">{log.action?.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    {log.field && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-gray-500">{log.field}:</span>
                        <span className="text-red-500 line-through">{log.oldValue?.toString() || 'empty'}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-green-600 font-semibold">{log.newValue?.toString() || 'empty'}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-purple-600 font-semibold mt-1">By: {log.adminName}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({ student, branches, onClose, onSuccess }) {
  const [form, setForm] = useState({
    sessionYear: new Date().getFullYear().toString(),
    studentClass: student.studentClass || '',
    branchId: (typeof student.branch === 'object' ? student.branch._id : student.branch) || '',
    board: student.board || 'CBSE',
    overrideReason: '',
  });
  const [loading, setLoading] = useState(false);
  const [overrideModal, setOverrideModal] = useState({ show: false, action: null, message: '' });

  const executeApprove = async (override = false) => {
    setLoading(true);
    setOverrideModal({ show: false, action: null, message: '' });
    try {
      const payload = { ...form };
      if (override) {
        payload.overrideBoardClassValidation = true;
        if (!payload.overrideReason) return toast.error('Please provide a reason for override');
      }
      const { data } = await api.put(`/admin/students/approve/${student._id}`, payload, { headers: authHeader() });
      toast.success(`✅ Approved! Student ID: ${data.data.studentId}`);
      onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_BOARD_CLASS_COMBINATION' && !override) {
        setOverrideModal({
          show: true,
          message: err.response.data.message,
          action: () => executeApprove(true)
        });
      } else {
        toast.error(err.response?.data?.message || 'Approval failed');
      }
    } finally {
      if (!override) setLoading(false);
    }
  };

  const handleApprove = (e) => {
    e.preventDefault();
    executeApprove(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-dark">Approve Registration</h3>
            <p className="text-xs text-gray-500">Approving: {student.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><XCircle className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleApprove} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Session Year</label>
              <select className="input-field" value={form.sessionYear} onChange={e => setForm({ ...form, sessionYear: e.target.value })} required>
                {['2024', '2025', '2026', '2027', '2028'].map(y => <option key={y} value={y}>Session {y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Board</label>
              <select className="input-field" value={form.board} onChange={e => setForm({ ...form, board: e.target.value, studentClass: '' })} required>
                <option value="">Select Board</option>
                {Object.keys(student.boardClassMap || {}).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Confirm Class</label>
            <select className="input-field" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} required>
              <option value="">Select Class</option>
              {(student.boardClassMap?.[form.board] || ['5','6','7','8','9','10','11','12']).map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign Branch</label>
            <select className="input-field" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="bg-brand-bg rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-bold uppercase">ID Preview</p>
            <p className="text-lg font-display font-black text-brand-dark">
              SRM–{form.sessionYear}–{form.studentClass?.padStart(2, '0') || '00'}–###
            </p>
            <p className="text-[10px] text-primary italic">* Sequence number auto-generated</p>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Approving...</> : <><UserCheck className="w-5 h-5" /> Confirm Approval</>}
          </button>
        </form>

        {overrideModal.show && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-6 rounded-3xl">
            <div className="bg-white border border-red-100 shadow-xl rounded-2xl w-full p-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h4 className="font-bold text-brand-dark mb-2">Override Constraint</h4>
              <p className="text-[11px] text-gray-500 mb-4">{overrideModal.message}</p>
              <div className="mb-4 text-left">
                <label className="text-[10px] font-bold text-red-600 uppercase mb-1 block">Override Reason (Audit Log)</label>
                <textarea 
                  className="input-field text-xs bg-gray-50 h-20" 
                  placeholder="Provide justification for this mismatch..."
                  value={form.overrideReason}
                  onChange={e => setForm({...form, overrideReason: e.target.value})}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setOverrideModal({ show: false })} className="btn-ghost flex-1 text-xs">Cancel</button>
                <button 
                  disabled={!form.overrideReason}
                  onClick={overrideModal.action} 
                  className="btn-primary bg-red-500 hover:bg-red-600 border-red-600 flex-1 text-xs disabled:opacity-50"
                >
                  Force Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StudentVerification({ selectedBranch, adminRole }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [boardClassMap, setBoardClassMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ board: '', studentClass: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data?.data?.filter(b => b.isActive) || [])).catch(() => { });
    fetchBoardClassMap().then(map => setBoardClassMap(map || {}));
    
    // Check URL parameters for tab
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['Pending', 'Active', 'Rejected'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page,
        limit: 15,
        ...(selectedBranch && { branch: selectedBranch }),
        ...(filters.board && { board: filters.board }),
        ...(filters.studentClass && { studentClass: filters.studentClass }),
        ...(search && { search }),
      });
      const { data } = await api.get(`/admin/students?${params}`, { headers: authHeader() });
      setStudents(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBranch, filters, page, search]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedBranch, filters, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openDetail = async (student) => {
    try {
      const { data } = await api.get(`/admin/students/${student._id}`, { headers: authHeader() });
      setSelectedStudent(data.data);
      setShowDetailModal(true);
    } catch {
      setSelectedStudent(student);
      setShowDetailModal(true);
    }
  };

  const TABS = [
    { id: 'Pending', label: 'Pending', color: 'bg-amber-500' },
    { id: 'Active', label: 'Active', color: 'bg-green-500' },
    { id: 'Rejected', label: 'Rejected', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-dark">Student Management</h2>
          <p className="text-gray-500 text-sm">Review registrations, assign batches, manage student records</p>
        </div>
        <button onClick={fetchStudents} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-all self-start">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? `${t.color} text-white shadow-glass-sm` : 'text-gray-400 hover:text-brand-dark'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 py-2.5 text-sm" placeholder="Search by name or student ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto py-2.5 text-sm" value={filters.board}
          onChange={e => setFilters({ ...filters, board: e.target.value })}>
          <option value="">All Boards</option>
          {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input-field w-auto py-2.5 text-sm" value={filters.studentClass}
          onChange={e => setFilters({ ...filters, studentClass: e.target.value })}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">{pagination.total} student{pagination.total !== 1 ? 's' : ''} found</p>

      {/* Student List */}
      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-gray-50/80" />
          ))
        ) : students.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No {activeTab} students found</p>
          </div>
        ) : (
          students.map(student => (
            <div key={student._id}
              className={`card p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all group
                ${student.isUnassignedBatch ? 'border-orange-200 bg-orange-50/30' : ''}
              `}>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {student.name?.[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0" onClick={() => openDetail(student)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-brand-dark">{student.name}</p>
                  <StatusBadge status={student.registrationStatus} />
                  {student.hasPendingBoardRequest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200">
                      📋 BOARD REQ
                    </span>
                  )}
                  {student.isUnassignedBatch && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                      📦 NO BATCH
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {student.studentId && <span className="text-xs font-mono text-primary font-semibold">{student.studentId}</span>}
                  <span className="text-xs text-gray-400">Class {student.studentClass}</span>
                  <span className="text-xs text-gray-400">{student.board}</span>
                  <span className="text-xs text-gray-400">{student.branch?.name}</span>
                  {student.batch && <span className="text-xs font-semibold text-purple-600">{student.batch}</span>}
                  <span className="text-xs text-gray-400">{new Date(student.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openDetail(student)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-primary"
                  title="View details">
                  <Eye className="w-4 h-4" />
                </button>
                {activeTab === 'Pending' && (
                  <button onClick={(e) => { e.stopPropagation(); setApproveTarget(student); setShowApproveModal(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white rounded-xl text-xs font-bold hover:bg-black transition-all">
                    Approve <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeTab === 'Rejected' && (
                  <button onClick={(e) => { e.stopPropagation(); setApproveTarget(student); setShowApproveModal(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
                    Approve <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:border-primary hover:text-primary transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showApproveModal && approveTarget && (
        <ApproveModal
          student={{...approveTarget, boardClassMap}}
          branches={branches}
          onClose={() => { setShowApproveModal(false); setApproveTarget(null); }}
          onSuccess={fetchStudents}
        />
      )}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={{...selectedStudent, boardClassMap}}
          branches={branches}
          adminRole={adminRole}
          onClose={() => { setShowDetailModal(false); setSelectedStudent(null); }}
          onRefresh={() => { fetchStudents(); setShowDetailModal(false); setSelectedStudent(null); }}
        />
      )}
    </div>
  );
}
