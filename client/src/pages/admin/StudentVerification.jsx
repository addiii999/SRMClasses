import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, CheckCircle, XCircle, Search, Calendar, 
  GraduationCap, Hash, ShieldCheck, Trash2, ArrowRight
} from 'lucide-react';

export default function StudentVerification() {
  const [activeTab, setActiveTab] = useState('pending');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [approvalForm, setApprovalForm] = useState({
    sessionYear: new Date().getFullYear().toString(),
    studentClass: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('srmAdminToken');
      const { data } = await api.get(`/admin/students/pending?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprove = (user) => {
    setSelectedUser(user);
    setApprovalForm({
      sessionYear: new Date().getFullYear().toString(),
      studentClass: user.studentClass || ''
    });
    setShowApproveModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('srmAdminToken');
      const { data } = await api.put(`/admin/students/approve/${selectedUser._id}`, approvalForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Approved! Student ID: ${data.data.studentId}`);
      setShowApproveModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Mark this registration as REJECTED? They will remain in the Rejected list.')) return;
    try {
      const token = localStorage.getItem('srmAdminToken');
      await api.delete(`/admin/students/reject/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Registration rejected');
      fetchUsers();
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && users.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-dark">Student Verification</h2>
          <p className="text-gray-500 text-sm">Review registrations and approve coaching students</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start md:self-center">
           <button 
             onClick={() => setActiveTab('pending')}
             className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-brand-dark text-white shadow-glass-sm' : 'text-gray-400 hover:text-brand-dark'}`}
           >
             PENDING
           </button>
           <button 
             onClick={() => setActiveTab('rejected')}
             className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'rejected' ? 'bg-red-500 text-white shadow-glass-sm' : 'text-gray-400 hover:text-red-500'}`}
           >
             REJECTED
           </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-primary" />
        <input 
          type="text" placeholder={`Search in ${activeTab} registrations...`}
          className="input-field pl-12 py-4 shadow-sm"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
             Array(3).fill(0).map((_, i) => (
                <div key={i} className="card p-6 h-32 animate-pulse bg-gray-50/50" />
             ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'pending' ? <CheckCircle className="w-8 h-8 text-green-400" /> : <XCircle className="w-8 h-8 text-gray-300" />}
             </div>
             <p className="text-gray-500 font-medium italic">No {activeTab} registrations found.</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div key={user._id} className="card p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-bold text-2xl shadow-glass ${activeTab === 'rejected' ? 'bg-gray-400' : 'bg-gradient-brand'}`}>
                {user.name[0]}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h3 className="font-bold text-brand-dark text-lg">{user.name}</h3>
                  {activeTab === 'rejected' && <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Rejected</span>}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                    <Hash className="w-3 h-3" /> {user.mobile}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                    <GraduationCap className="w-3 h-3" /> Class {user.studentClass}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3 h-3" /> Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => handleOpenApprove(user)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${activeTab === 'rejected' ? 'bg-primary text-white hover:bg-primary/90' : 'bg-brand-dark text-white hover:bg-black'}`}
                >
                  {activeTab === 'rejected' ? 'Approve Now' : 'Approve'} <ArrowRight className="w-4 h-4" />
                </button>
                {activeTab === 'pending' && (
                  <button 
                    onClick={() => handleReject(user._id)}
                    className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-brand-bg flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-brand-dark">Complete Enrollment</h3>
                <p className="text-xs text-gray-500">Approving {selectedUser.name}</p>
              </div>
              <button 
                onClick={() => setShowApproveModal(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              ><XCircle className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleApprove} className="p-6 space-y-6">
              <div>
                <label className="label">Academic Session Year</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['2025', '2026', '2027', '2028'].map(year => (
                    <button 
                      key={year} type="button"
                      onClick={() => setApprovalForm({...approvalForm, sessionYear: year})}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${approvalForm.sessionYear === year ? 'bg-primary border-primary text-white shadow-glass-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30'}`}
                    >
                      Session {year}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Confirm Student Class</label>
                <select 
                  className="input-field mt-2" 
                  value={approvalForm.studentClass} 
                  onChange={e => setApprovalForm({...approvalForm, studentClass: e.target.value})}
                  required
                >
                   {['6','7','8','9','10','11','12'].map(c => (
                     <option key={c} value={c}>Class {c}</option>
                   ))}
                </select>
              </div>

              <div className="p-4 bg-brand-bg rounded-2xl space-y-2">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID Preview</p>
                 <p className="text-xl font-display font-black text-brand-dark tracking-tighter">
                   SRM–{approvalForm.sessionYear}–{approvalForm.studentClass?.padStart(2, '0') || '00'}–###
                 </p>
                 <p className="text-[10px] text-primary font-medium italic">* Sequence number auto-generated</p>
              </div>

              <button type="submit" className="btn-primary w-full py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
                <ShieldCheck className="w-5 h-5" /> Confirm Approval
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
