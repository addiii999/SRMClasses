import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Trash2, RotateCcw, Calendar, User, Image, FileText, 
  Search, Filter, AlertTriangle, Clock, RefreshCw, ClipboardList
} from 'lucide-react';

const TYPE_ICONS = {
  Student: <User className="w-4 h-4 text-blue-500" />,
  Faculty: <User className="w-4 h-4 text-emerald-500" />,
  Gallery: <Image className="w-4 h-4 text-purple-500" />,
  Result: <FileText className="w-4 h-4 text-orange-500" />,
  Material: <FileText className="w-4 h-4 text-amber-500" />,
  Announcement: <Clock className="w-4 h-4 text-cyan-500" />,
  Booking: <Calendar className="w-4 h-4 text-indigo-500" />,
  Enquiry: <Clock className="w-4 h-4 text-teal-500" />,
  Course: <FileText className="w-4 h-4 text-rose-500" />,
  WeeklyTest: <ClipboardList className="w-4 h-4 text-pink-500" />
};

export default function AdminRecycleBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recycle-bin');
      setItems(data.data || []);
    } catch (error) {
      toast.error('Failed to load recycle bin');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item) => {
    if (!window.confirm(`Are you sure you want to restore this ${item.type}: ${item.name}?`)) return;
    try {
      await api.patch(`/recycle-bin/restore/${item.type}/${item._id}`);
      toast.success(`${item.type} restored successfully`);
      fetchItems();
    } catch (error) {
      toast.error('Restoration failed');
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm(`⚠️ CRITICAL: Are you sure you want to PERMANENTLY delete this ${item.type}: ${item.name}? This action CANNOT be undone and will remove all associated files.`)) return;
    try {
      await api.delete(`/recycle-bin/permanent/${item.type}/${item._id}`);
      toast.success(`${item.type} purged permanently`);
      fetchItems();
    } catch (error) {
      toast.error('Permanent deletion failed');
    }
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getDayLabel = (days) => {
    if (days <= 0) return 'Purging Soon...';
    if (days === 1) return 'Last day left';
    return `${days} days left`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-dark flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-primary" /> Recycle Bin
          </h2>
          <p className="text-gray-500 text-sm mt-1">Items here will be permanently deleted after 30 days.</p>
        </div>
        <button 
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" placeholder="Search deleted items..."
            className="input-field pl-12 py-3"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="input-field w-auto py-3 px-6"
          value={filterType} onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {Object.keys(TYPE_ICONS).map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Deleted By</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Retention Scale</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-6 animate-pulse bg-gray-50/10"></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 grayscale opacity-50">
                      <Trash2 className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">Recycle bin is empty</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((item) => (
                <tr key={item._id} className="hover:bg-brand-bg transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                        {TYPE_ICONS[item.type]}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(item.deletedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase">{item.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{item.deletedBy}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5 min-w-[120px]">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className={item.remainingDays <= 5 ? 'text-red-500' : 'text-primary'}>{getDayLabel(item.remainingDays)}</span>
                        <span className="text-gray-300">30d total</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${item.remainingDays <= 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary'}`} 
                          style={{ width: `${(item.remainingDays / 30) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleRestore(item)}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                        title="Restore Item"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(item)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all font-bold"
                        title="Permanent Delete"
                      >
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
      
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            <strong>Pro Tip:</strong> Data lifecycles are strictly managed. Items older than 30 days are automatically purged at 01:00 AM daily. Permanent deletion also clears all related storage images/files to optimize space.
          </p>
        </div>
      )}
    </div>
  );
}
