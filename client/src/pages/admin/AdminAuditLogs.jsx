import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { History, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function AdminAuditLogs({ adminRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // stores { studentId, logId }
  const [confirmInput, setConfirmInput] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=50&showDeleted=${showDeleted}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('srmAdminToken')}` }
      });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (e) => {
    e.preventDefault();
    if (confirmInput !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/audit-logs/${deleteModal.studentDocId}/${deleteModal.logId}`, {
        data: { reason: deleteReason },
        headers: { Authorization: `Bearer ${sessionStorage.getItem('srmAdminToken')}` }
      });
      toast.success('Audit log soft-deleted and history updated');
      setDeleteModal(null);
      setConfirmInput('');
      setDeleteReason('');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete log');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, showDeleted]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-brand-dark flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> Audit Logs
          </h2>
          <p className="text-gray-500 mt-1">
            {adminRole === 'SUPER_ADMIN' ? 'Viewing global admin actions across the system.' : 'Viewing your admin actions.'}
          </p>
        </div>
        {adminRole === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <input 
              type="checkbox" 
              id="show-deleted" 
              className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            <label htmlFor="show-deleted" className="text-sm font-semibold text-gray-600 cursor-pointer select-none">Show Deleted Logs</label>
          </div>
        )}
      </div>

      <div className="card p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No audit logs found</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Timestamp</th>
                {adminRole === 'SUPER_ADMIN' && <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Admin</th>}
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Action</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Target Student</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Field</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Change</th>
                {adminRole === 'SUPER_ADMIN' && <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((item, idx) => (
                <tr key={`${item.studentId}-${idx}`} className="hover:bg-brand-bg/50 transition-colors">
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(item.log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  {adminRole === 'SUPER_ADMIN' && (
                    <td className="py-3 px-4 text-brand-dark font-medium">{item.log.adminName}</td>
                  )}
                  <td className="py-3 px-4">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {item.log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-brand-dark font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    {item.studentName} <span className="text-gray-400 text-xs font-normal">({item.studentId})</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{item.log.field || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500 line-through truncate max-w-[150px]">{item.log.oldValue || 'None'}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-xs text-emerald-600 font-medium truncate max-w-[150px]">{item.log.newValue || 'None'}</span>
                      {item.log.isDeleted && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold uppercase rounded">Deleted</span>}
                    </div>
                  </td>
                  {adminRole === 'SUPER_ADMIN' && (
                    <td className="py-3 px-4">
                      {!item.log.isDeleted ? (
                        <button 
                          onClick={() => setDeleteModal({ studentDocId: item.studentDocId, logId: item.log._id, action: item.log.action })}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          title="Soft delete audit log"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300 italic">No actions</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Security: Deletion Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-red-50">
              <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                🔒 Controlled Deletion
              </h3>
              <p className="text-sm text-red-600 mt-1 opacity-80">
                This action will hide the log but remains traceable. This cannot be undone easily.
              </p>
            </div>
            
            <form onSubmit={handleSoftDelete} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Log Action to Hide</label>
                <div className="text-sm font-mono bg-gray-50 p-2 rounded-lg border border-gray-200 text-gray-600 capitalize">
                  {deleteModal.action}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reason for deletion (Internal Audit)</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                  rows={2}
                  placeholder="e.g., Incorrect data entry, testing log, etc."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">To confirm, type <span className="text-red-600">DELETE</span> below</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-amber-200 rounded-lg px-4 py-2 text-center font-bold tracking-widest outline-none focus:ring-1 focus:ring-red-500"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Type here..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setDeleteModal(null); setConfirmInput(''); setDeleteReason(''); }}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={confirmInput !== 'DELETE' || isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? 'Processing...' : 'Delete Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
