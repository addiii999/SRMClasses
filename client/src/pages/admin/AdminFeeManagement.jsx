import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Search, Filter, Edit2, Plus, CreditCard, ChevronDown, 
  History, Trash2, AlertTriangle, CheckCircle, Clock, TrendingUp, RotateCcw
} from 'lucide-react';

const FEE_TYPES = ['Foundation', 'Advance', 'Math-Science', 'ICSE-Advance', 'None'];

const FEE_STRUCTURE = {
  'Foundation': { '5': 6500, '6': 7500, '7': 8500, '8': 9500, '9': 12000, '10': 14400 },
  'Advance': { '5': 7500, '6': 10000, '7': 12000, '8': 15000, '9': 18000, '10': 20000 },
  'Math-Science': { '9': 8400, '10': 9600 },
  'ICSE-Advance': { '6': 15000, '7': 18000, '8': 20000, '9': 22000, '10': 25000 }
};

export default function AdminFeeManagement({ selectedBranch }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'remainingAmount', direction: 'desc' });
  const [enrollmentTab, setEnrollmentTab] = useState('active'); // active or removed

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
      const res = await api.get(`/fees/students?status=${enrollmentTab}${branchParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [enrollmentTab, selectedBranch]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = students
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.mobile.includes(search);
      const matchesClass = filterClass === 'all' || s.studentClass === filterClass;
      const matchesStatus = filterStatus === 'all' || s.paymentStatus === filterStatus;
      return matchesSearch && matchesClass && matchesStatus;
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const getStatusBadge = (status) => {
    const colors = {
      Paid: 'bg-green-100 text-green-700',
      Partial: 'bg-yellow-100 text-yellow-700',
      Pending: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const handleRemove = async (student) => {
    if (!window.confirm(`Are you sure you want to remove ${student.name} from the active fee list? Their data will NOT be deleted.`)) return;
    
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      await api.patch(`/fees/remove/${student._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student removed from active list');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Removal failed');
    }
  };

  const handleRestore = async (student) => {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      await api.patch(`/fees/restore/${student._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student restored successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Restoration failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-dark">Fee Management</h2>
          <p className="text-gray-500 text-sm mt-1">Track payments, scholarships, and installment plans.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setEnrollmentTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${enrollmentTab === 'active' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Active Students
          </button>
          <button 
            onClick={() => setEnrollmentTab('removed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${enrollmentTab === 'removed' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Removed Students
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            className="input-field pl-9 py-2" 
            placeholder="Search student name or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="input-field py-2 w-auto"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="all">All Classes</option>
          {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select 
          className="input-field py-2 w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type / Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SAT %</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('payableAmount')}
                >
                  Payable
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('remainingAmount')}
                >
                  Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-4 animate-pulse"><div className="h-4 bg-gray-100 rounded" /></td></tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No students found.</td></tr>
              ) : filteredStudents.map(s => (
                <tr key={s._id} className="hover:bg-brand-bg transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-brand-dark">{s.name}</p>
                      <p className="text-xs text-gray-400">Class {s.studentClass} • {s.mobile}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-600">{s.feeType || 'None'}</p>
                    <p className="text-[10px] text-gray-400">{s.installmentPlan} Installments</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">{s.satPercentage}%</td>
                  <td className="px-4 py-3 font-semibold text-brand-dark">₹{s.payableAmount}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">₹{s.paidAmount}</td>
                  <td className="px-4 py-3 text-red-600 font-bold">₹{s.remainingAmount}</td>
                  <td className="px-4 py-3">{getStatusBadge(s.paymentStatus)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {enrollmentTab === 'active' ? (
                        <>
                          <button 
                            title="Edit Fee Settings"
                            onClick={() => { setSelectedStudent(s); setShowFeeModal(true); }}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            title="Add Payment"
                            onClick={() => { setSelectedStudent(s); setShowPaymentModal(true); }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button 
                            title="Payment History"
                            onClick={() => { setSelectedStudent(s); setShowHistoryModal(true); }}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            title="Remove from Fee System"
                            onClick={() => handleRemove(s)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            title="Payment History"
                            onClick={() => { setSelectedStudent(s); setShowHistoryModal(true); }}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            title="Restore Student"
                            onClick={() => handleRestore(s)}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals placeholders - we'll build them below or import them */}
      {showFeeModal && (
        <FeeModal 
          student={selectedStudent} 
          onClose={() => setShowFeeModal(false)} 
          onSuccess={() => { setShowFeeModal(false); fetchStudents(); }} 
        />
      )}
      {showPaymentModal && (
        <PaymentModal 
          student={selectedStudent} 
          onClose={() => setShowPaymentModal(false)} 
          onSuccess={(updatedStudent) => {
             setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
             setSelectedStudent(updatedStudent);
          }} 
        />
      )}
      {showHistoryModal && (
        <HistoryModal 
          studentId={selectedStudent?._id} 
          onClose={() => setShowHistoryModal(false)} 
          onRefresh={(updatedStudent) => {
             if (updatedStudent) {
               setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
               setSelectedStudent(updatedStudent);
             } else {
               fetchStudents();
             }
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-Components (Modals) ───────────────────────────────────────────

function FeeModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({
    feeType: student.feeType || 'None',
    satPercentage: student.satPercentage || '', // Starts empty for better UX
    installmentPlan: student.installmentPlan || 1,
    registrationFeeApplicable: student.registrationFeeApplicable !== false
  });
  const [loading, setLoading] = useState(false);

  // Real-time Calculation Breakdown (Synced with Doc April 2026)
  const yearlyFee = FEE_STRUCTURE[form.feeType]?.[student.studentClass] || 0;
  const satValue = Number(form.satPercentage) || 0;
  
  // SAT discount is capped at satValue / 3 %
  const satDiscountPercent = satValue / 3;
  const satAmount = Math.round(yearlyFee * (satDiscountPercent / 100));
  const afterSat = yearlyFee - satAmount;
  
  let instDiscountPercent = 0;
  if (form.installmentPlan === 1) instDiscountPercent = 10;
  else if (form.installmentPlan === 2) instDiscountPercent = 5;

  const instAmount = Math.round(afterSat * (instDiscountPercent / 100));
  const admissionFee = form.registrationFeeApplicable ? 500 : 0;
  const finalPayable = (afterSat - instAmount) + admissionFee; // Conditional Admission Fee

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Normalize satPercentage to 0 if empty
      const payload = { 
        ...form, 
        satPercentage: Number(form.satPercentage) || 0,
        force
      };
      await api.put(`/fees/settings/${student._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Fee settings updated!');
      onSuccess();
    } catch (error) {
      if (error.response?.data?.isOverpaymentWarning) {
        if (window.confirm(error.response.data.message)) {
          handleSubmit(null, true);
          return;
        }
      } else {
        toast.error(error.response?.data?.message || 'Update failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-brand-bg">
          <h3 className="font-display font-bold text-brand-dark">Edit Fee – {student.name}</h3>
          <XBtn onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {student.paidAmount > 0 && (
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex gap-3 text-yellow-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>Changing these settings will recalculate the balance for existing payments.</p>
            </div>
          )}
          
          <div>
            <label className="label">Fee Type</label>
            <select 
              className="input-field" 
              value={form.feeType}
              onChange={(e) => setForm({ ...form, feeType: e.target.value })}
            >
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="label">SAT Percentage (%)</label>
            <input 
              type="number" className="input-field" min="0" max="100"
              placeholder="Enter SAT % (e.g. 60)"
              value={form.satPercentage} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') setForm({ ...form, satPercentage: '' });
                else if (Number(val) <= 100) setForm({ ...form, satPercentage: Number(val) });
              }}
            />
          </div>

          <div>
            <label className="label">Installment Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(plan => (
                <button 
                  key={plan} type="button"
                  onClick={() => setForm({ ...form, installmentPlan: plan })}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    form.installmentPlan === plan 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {plan} {plan === 1 ? 'Month' : 'Months'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div>
              <p className="text-sm font-bold text-brand-dark">Apply Registration Fee</p>
              <p className="text-[10px] text-gray-400">Add ₹500 fixed admission charge</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" className="sr-only peer"
                checked={form.registrationFeeApplicable}
                onChange={(e) => setForm({ ...form, registrationFeeApplicable: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Real-time Breakdown Card */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm space-y-3">
             <div className="flex items-center gap-2 mb-2">
               <TrendingUp className="w-4 h-4 text-primary" />
               <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">📊 Fee Breakdown</h4>
             </div>
             
             <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Admission Fee:</span>
                  <span className={`font-semibold ${form.registrationFeeApplicable ? 'text-brand-dark' : 'text-gray-400 line-through'}`}>
                    ₹{admissionFee}
                  </span>
                </div>
               <div className="flex justify-between text-gray-600 pb-3 border-b border-gray-200">
                 <span>Yearly Fee:</span>
                 <span className="font-semibold text-brand-dark">₹{yearlyFee.toLocaleString('en-IN')}</span>
               </div>

               <div className="flex justify-between text-gray-600 pt-2">
                 <span>SAT Discount ({satValue}% → {satDiscountPercent.toFixed(2)}%):</span>
                 <span className="text-red-500 font-medium">- ₹{satAmount.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-xs text-gray-400 pb-3 border-b border-gray-200 italic">
                 <span>After SAT:</span>
                 <span>₹{afterSat.toLocaleString('en-IN')}</span>
               </div>

               <div className="flex justify-between text-gray-600 pt-2">
                 <span>Installment Discount ({instDiscountPercent}%):</span>
                 <span className="text-red-500 font-medium">- ₹{instAmount.toLocaleString('en-IN')}</span>
               </div>
               
               <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
                 <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-dark uppercase text-xs">Final Payable:</span>
                    <div className="text-right">
                       <p className="text-2xl font-display font-black text-green-600">₹{finalPayable.toLocaleString('en-IN')}</p>
                       <p className="text-[10px] text-gray-400 leading-none">Rounding applied</p>
                    </div>
                 </div>
               </div>
             </div>
          </div>

          {yearlyFee === 0 && form.feeType !== 'None' && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3 text-red-700 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>Warning: {form.feeType} fee is not defined for Class {student.studentClass} in the policy.</p>
            </div>
          )}

          <div className="pt-2">
            <button 
              disabled={loading || (yearlyFee === 0 && form.feeType !== 'None')} 
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: '', method: 'cash' });
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (e) => {
    let val = e.target.value;
    if (val === '') {
      setForm({ ...form, amount: '' });
      return;
    }
    // Remove leading zeros: 01 -> 1, 000 -> 0 (but we prefer empty for 0)
    val = val.replace(/^0+/, '');
    setForm({ ...form, amount: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(form.amount);
    
    if (amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amt > student.remainingAmount) {
      toast.error(`Amount exceeds payable fee. Max possible: ₹${student.remainingAmount}`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.post(`/fees/payment/${student._id}`, { ...form, amount: amt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payment recorded!');
      onSuccess(res.data.data);
      setForm({ amount: '', method: 'cash' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const sortedPayments = [...(student.payments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50 text-emerald-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
               <CreditCard className="w-5 h-5 text-emerald-600" />
             </div>
             <h3 className="font-display font-bold">Add Payment – {student.name}</h3>
          </div>
          <XBtn onClick={onClose} />
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Header Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
               <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Payable</p>
               <p className="text-lg font-bold text-brand-dark">₹{student.payableAmount.toLocaleString('en-IN')}</p>
             </div>
             <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
               <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">Remaining</p>
               <p className="text-xl font-black text-red-600">₹{student.remainingAmount.toLocaleString('en-IN')}</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="label mb-0">Amount to Pay (₹)</label>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Max ₹{student.remainingAmount}</span>
              </div>
              <input 
                type="number" className="input-field" placeholder="Enter amount..."
                value={form.amount} 
                onChange={handleAmountChange}
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">Enter only digits. No leading zeros.</p>
            </div>

            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {['cash', 'upi', 'bank', 'cheque'].map(m => (
                  <button 
                    key={m} type="button"
                    onClick={() => setForm({ ...form, method: m })}
                    className={`py-2 rounded-xl text-[10px] font-semibold capitalize transition-all ${
                      form.method === m 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button 
                disabled={loading || !form.amount || Number(form.amount) <= 0} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3.5 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'Recording...' : `Record ₹${Number(form.amount).toLocaleString('en-IN')} Payment`}
              </button>
            </div>
          </form>

          {/* Mini History Section */}
          <div className="pt-4 border-t border-gray-100">
             <div className="flex items-center gap-2 mb-4">
               <History className="w-4 h-4 text-emerald-600" />
               <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">📜 Recent Payments</h4>
             </div>
             
             <div className="space-y-3">
               {sortedPayments.length === 0 ? (
                 <p className="text-center py-4 text-xs text-gray-400 italic">No payments recorded yet.</p>
               ) : (
                 sortedPayments.slice(0, 5).map((p, i) => (
                    <div key={p._id || i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-sm">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-bold shrink-0">₹</div>
                          <div>
                            <p className="font-bold text-brand-dark">₹{p.amount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400 uppercase">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {p.method}</p>
                          </div>
                       </div>
                    </div>
                 ))
               )}
               {sortedPayments.length > 5 && (
                 <p className="text-center text-[10px] text-primary font-bold uppercase cursor-pointer hover:underline">View All in History Modal</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ studentId, onClose, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // For Edit/Delete
  const [editingPayment, setEditingPayment] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      // For history, we just get student my-fee endpoint but since we are admin, we should probably have a specific one
      // But we can use current student stats or just fetch the student again.
      // We already have their ID.
      const res = await api.get('/fees/students', { headers: { Authorization: `Bearer ${token}` } });
      const student = res.data.data.find(s => s._id === studentId);
      setData(student);
    } catch { toast.error('History load failed'); }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (pid) => {
    if (!confirm('Are you sure you want to delete this payment record? This will increase the remaining balance.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.delete(`/fees/payment/${studentId}/${pid}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Payment deleted');
      setData(res.data.data);
      onRefresh(res.data.data);
    } catch { toast.error('Delete failed'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.put(`/fees/payment/${studentId}/${editingPayment._id}`, {
        amount: editingPayment.amount,
        method: editingPayment.method
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Payment updated');
      setEditingPayment(null);
      setData(res.data.data);
      onRefresh(res.data.data);
    } catch { toast.error('Edit failed'); }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-brand-dark">Payment History & Timeline</h3>
          </div>
          <XBtn onClick={onClose} />
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? <div className="text-center py-10">Loading history...</div> : (
            <div className="space-y-8">
              {/* Installment Breakdown */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Installment Schedule
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data?.installments?.map(inst => (
                    <div key={inst.number} className={`p-4 rounded-2xl border-2 transition-all ${
                      inst.status === 'Paid' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase"># {inst.number}</span>
                        {inst.status === 'Paid' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-100" />}
                      </div>
                      <p className="text-lg font-bold text-brand-dark">₹{inst.amount}</p>
                      <p className={`text-[10px] uppercase font-bold ${inst.status === 'Paid' ? 'text-green-600' : 'text-gray-400'}`}>{inst.status}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment Timeline */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Transactions Log</h4>
                <div className="space-y-3">
                  {data?.payments?.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No transactions recorded.</p> : (
                    data?.payments?.map(p => (
                      <div key={p._id} className="group flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-primary/10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">₹</div>
                          <div>
                            <p className="font-bold text-brand-dark">₹{p.amount}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-tighter">{p.method} • {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingPayment(p)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(p._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Inline Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-brand-dark mb-4">Edit Transaction</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Amount (₹)</label>
                <input 
                  type="number" className="input-field" required
                  value={editingPayment.amount} 
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Method</label>
                <select 
                  className="input-field" 
                  value={editingPayment.method}
                  onChange={(e) => setEditingPayment({ ...editingPayment, method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingPayment(null)} className="flex-1 py-2 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-semibold shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function XBtn({ onClick }) {
  return (
    <button onClick={onClick} className="p-2 hover:bg-black/5 rounded-full transition-colors">
      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
