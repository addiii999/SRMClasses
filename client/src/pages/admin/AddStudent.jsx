import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UserPlus, ArrowRight, AlertTriangle } from 'lucide-react';
import { fetchBoardClassMap, getAllowedBoardsForClass } from '../../utils/boardConstraints';

export default function AddStudent() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', studentClass: '', password: '', branch: '', board: 'CBSE', overrideReason: '' });
  const [configMap, setConfigMap] = useState(null);
  const [allowedClasses, setAllowedClasses] = useState([]);
  const [showOverride, setShowOverride] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoardClassMap().then(setConfigMap);
  }, []);

  useEffect(() => {
    if (configMap) {
      // Find classes allowed for the selected board
      const classes = configMap[form.board] || [];
      setAllowedClasses(classes);
    }
  }, [configMap, form.board]);

  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data?.data || []))
      .catch(() => toast.error('Failed to load branches'));
  }, []);

  const executeSubmit = async (override = false) => {
    setLoading(true);
    try {
      const payload = { ...form };
      if (override) {
        payload.overrideBoardClassValidation = true;
        if (!payload.overrideReason) {
           setLoading(false);
           return toast.error('Please provide an override reason');
        }
      }

      await api.post('/admin/users/create', payload);
      toast.success('Student created');
      navigate('/admin/verify-students');
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_BOARD_CLASS_COMBINATION' && !override) {
        setShowOverride(true);
      } else {
        toast.error(err.response?.data?.message || 'Creation failed');
      }
    } finally {
      if (!override) setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSubmit(false);
  };



  return (
    <div className="card p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-display font-bold mb-4">Add Student (Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="input-field" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="email" className="input-field" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input className="input-field" placeholder="Mobile" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} required />
        <select className="input-field" value={form.board || 'CBSE'} onChange={e => setForm({ ...form, board: e.target.value, studentClass: '' })} required>
          <option value="CBSE">CBSE Board</option>
          <option value="ICSE">ICSE Board</option>
          <option value="JAC">JAC Board</option>
        </select>
        <select className="input-field" value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} required>
          <option value="">Select Class</option>
          {['5','6','7','8','9','10','11','12'].map(c => {
             const isAllowed = allowedClasses.includes(c);
             return (
               <option key={c} value={c} className={!isAllowed ? 'text-red-500 font-bold' : ''}>
                 Class {c} {!isAllowed ? '(Invalid Board Choice)' : ''}
               </option>
             );
          })}
        </select>
        <input type="password" className="input-field" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <select className="input-field" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required>
          <option value="">Select Branch</option>
          {(branches || []).map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? 'Creating...' : <><UserPlus className="w-4 h-4" /> Create Student <ArrowRight className="w-4 h-4" /></>}
        </button>

        {showOverride && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
               <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                 <AlertTriangle className="w-5 h-5" /> Validation Override
               </div>
               <p className="text-sm text-gray-500 mb-4">
                 The selected Board and Class combination is usually not allowed. Provide a reason to force create this student.
               </p>
               <textarea 
                  className="input-field h-24 mb-4 text-sm" 
                  placeholder="Why is this being overridden?"
                  value={form.overrideReason}
                  onChange={e => setForm({...form, overrideReason: e.target.value})}
               />
               <div className="flex gap-3">
                 <button type="button" onClick={() => setShowOverride(false)} className="btn-ghost flex-1">Cancel</button>
                 <button type="button" 
                   onClick={() => executeSubmit(true)} 
                   disabled={!form.overrideReason}
                   className="btn-primary bg-red-600 hover:bg-red-700 border-red-700 flex-1 disabled:opacity-50"
                 >
                   Confirm Override
                 </button>
               </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
