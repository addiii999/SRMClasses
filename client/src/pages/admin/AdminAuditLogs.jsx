import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { History, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function AdminAuditLogs({ adminRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('srmAdminToken')}` }
      });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

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
                    </div>
                  </td>
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
    </div>
  );
}
