import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, CheckCircle, XCircle, Search, Calendar, 
  GraduationCap, Hash, ShieldCheck, Trash2, ArrowRight
} from 'lucide-react';

export default function StudentVerification({ selectedBranch }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('status') || 'pending';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [approvalForm, setApprovalForm] = useState({
    sessionYear: new Date().getFullYear().toString(),
    studentClass: '',
    branchId: '',
    board: 'CBSE'
  });

  useEffect(() => {
    // Load branches for selection in modal
    api.get('/branches').then(res => setBranches(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [activeTab, selectedBranch]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('srmAdminToken');
      const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
      const { data } = await api.get(`/admin/students/pending?status=${activeTab}${branchParam}`, {
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
      studentClass: user.studentClass || '',
      branchId: user.branch || selectedBranch || '',
      board: user.board || 'CBSE'
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

  const handleRestoreToFees = async (id) => {
    try {
      const token = localStorage.getItem('srmAdminToken');
      await api.patch(`/fees/restore/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student restored to Fee Management');
      fetchUsers();
    } catch (error) {
      toast.error('Restoration failed');
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
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'approved' ? 'bg-green-600 text-white shadow-glass-sm' : 'text-gray-400 hover:text-green-600'}`}
            >
              APPROVED
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
                  {user.studentId && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-100 flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> {user.studentId}
                    </span>
                  )}
                  {user.mobile && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                      <Hash className="w-3 h-3" /> {user.mobile}
                    </span>
                  )}
                  {user.email && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                       {user.email}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                    <GraduationCap className="w-3 h-3" /> Class {user.studentClass}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3 h-3" /> Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                  {user.branch && (
                     <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                       {user.branch.name || user.branch}
                     </span>
                  )}
                  {user.board && (
                     <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                       {user.board}
                     </span>
                  )}
                </div>
              </div>

                {activeTab === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleOpenApprove(user)}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 bg-brand-dark text-white hover:bg-black"
                    >
                      Approve <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleReject(user._id)}
                      className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                {activeTab === 'rejected' && (
                  <button 
                    onClick={() => handleOpenApprove(user)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 bg-primary text-white hover:bg-primary/90"
                  >
                    Approve Now <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {activeTab === 'approved' && (
                  <div className="flex items-center gap-3">
                    {user.isEnrolled === false && (
                      <button 
                        onClick={() => handleRestoreToFees(user._id)}
                        className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-bold hover:bg-yellow-100 transition-all flex items-center gap-1.5"
                      >
                        <ArrowRight className="w-4 h-4" /> Enrol Now
                      </button>
                    )}
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${user.isEnrolled !== false ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                      <CheckCircle className="w-4 h-4" /> {user.isEnrolled !== false ? 'Verified & Active' : 'Verified (Inactive)'}
                    </div>
                  </div>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Academic Session</label>
                  <select 
                    className="input-field mt-2" 
                    value={approvalForm.sessionYear} 
                    onChange={e => setApprovalForm({...approvalForm, sessionYear: e.target.value})}
                    required
                  >
                    {['2025', '2026', '2027', '2028'].map(year => (
                      <option key={year} value={year}>Session {year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Board</label>
                  <select 
                    className="input-field mt-2" 
                    value={approvalForm.board} 
                    onChange={e => setApprovalForm({...approvalForm, board: e.target.value, studentClass: ''})}
                    required
                  >
                    <option value="CBSE">CBSE Board</option>
                    <option value="ICSE">ICSE Board</option>
                    <option value="JAC">JAC Board</option>
                  </select>
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
                   <option value="">Select Class</option>
                   {(() => {
                     const validBoardClass = {
                       'CBSE': ['5', '6', '7', '8', '9', '10', '11', '12'],
                       'ICSE': ['6', '7', '8', '9', '10'],
                       'JAC': ['11', '12']
                     };
                     const allowed = validBoardClass[approvalForm.board] || [];
                     return allowed.map(c => (
                       <option key={c} value={c}>Class {c}</option>
                     ));
                   })()}
                </select>
              </div>

              <div>
                <label className="label">Assign Branch</label>
                <select 
                  className="input-field mt-2" 
                  value={approvalForm.branchId} 
                  onChange={e => setApprovalForm({...approvalForm, branchId: e.target.value})}
                  required
                >
                   <option value="">Select Branch</option>
                   {(branches || []).map(b => (
                     <option key={b._id} value={b._id}>{b.name}</option>
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
