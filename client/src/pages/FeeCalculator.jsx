import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, CheckCircle, Info, ArrowRight, ShieldCheck, Tag, Target, Calendar, Phone } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

// Backend logic replicated for instant 0ms latency
const FEE_STRUCTURE = {
  'Foundation': { '5': 6500, '6': 7500, '7': 8500, '8': 9500, '9': 12000, '10': 14400 },
  'Advance': { '5': 7500, '6': 10000, '7': 12000, '8': 15000, '9': 18000, '10': 20000 },
  'Math-Science': { '9': 8400, '10': 9600 },
  'ICSE-Advance': { '6': 15000, '7': 18000, '8': 20000, '9': 22000, '10': 25000 },
  'Commerce Advance': { '11': 0, '12': 0 } // Fee unconfirmed
};

const BOARD_CLASSES = {
  'CBSE': ['5','6','7','8','9','10','11','12'],
  'ICSE': ['6','7','8','9','10'],
  'JAC': ['11','12']
};

export default function FeeCalculator() {
  const [form, setForm] = useState({
    board: 'CBSE',
    studentClass: '',
    batch: '',
    satScore: 0
  });

  const [activePlan, setActivePlan] = useState(1); // Default to full payment viewing
  const [mobileNumber, setMobileNumber] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const handleClassChange = (e) => {
    const val = e.target.value;
    // Auto-reset batch if it becomes invalid (e.g., Math-Science is only 9-10)
    let newBatch = form.batch;
    if (newBatch === 'Math-Science' && !['9', '10'].includes(val)) newBatch = '';
    
    setForm({ ...form, studentClass: val, batch: newBatch });
  };

  const calculateFees = useMemo(() => {
    const actualFee = FEE_STRUCTURE[form.batch]?.[form.studentClass] || 0;
    const satScore = Number(form.satScore) || 0;
    
    // SAT discounting (cap capped at score / 3 as per backend policy)
    const satDiscountPercent = satScore / 3;
    const satDiscountAmount = Math.round(actualFee * (satDiscountPercent / 100));
    const afterSat = actualFee - satDiscountAmount;
    const admissionFee = 500; // Always included

    // Compute Plans
    const plans = [1, 2, 3].map(planNumber => {
      let instDiscountPercent = 0;
      if (planNumber === 1) instDiscountPercent = 10;
      else if (planNumber === 2) instDiscountPercent = 5;

      const instDiscountAmount = Math.round(afterSat * (instDiscountPercent / 100));
      const payableAmount = (afterSat - instDiscountAmount) + admissionFee;
      const installmentAmount = Math.round(payableAmount / planNumber);

      return {
        installments: planNumber,
        instDiscountPercent,
        instDiscountAmount,
        payableAmount,
        installmentAmount
      };
    });

    return {
      actualFee,
      admissionFee,
      satDiscountPercent,
      satDiscountAmount,
      afterSat,
      plans
    };
  }, [form.studentClass, form.batch, form.satScore]);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLeadSubmitting(true);
    try {
      await api.post('/enquiries', {
        name: 'Fee Calculator User',
        email: `calc-${Date.now()}@srm.local`,
        mobile: mobileNumber,
        schoolName: 'Not Provided',
        studentClass: form.studentClass,
        message: `Auto Lead via Fee Calculator | Board: ${form.board} | Batch: ${form.batch} | SAT: ${form.satScore}% | Final Plan: ₹${calculateFees.plans[activePlan - 1].payableAmount} (${activePlan} installments)`
      });
      toast.success('Your request is recorded! A counsellor will call you shortly.');
      setLeadCaptured(true);
    } catch (error) {
      if (error.response?.data?.message?.includes('already submitted')) {
        toast.success('We already have your request! We will call you soon.');
        setLeadCaptured(true);
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <>
      <div className="pt-44 md:pt-48 overflow-x-hidden min-h-screen bg-brand-bg relative pb-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-dark/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container-pad relative z-10">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary/10 text-primary uppercase tracking-wider text-xs font-bold mb-4 shadow-sm">
              <Calculator className="w-3.5 h-3.5" />
              Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-dark mb-4 drop-shadow-sm">
              Estimate Your Total Fee
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              Use our live calculator to see the complete fee breakdown, including scholarships and installment discounts, before you join.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-8">
            
            {/* INPUT SECTION */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card-hover border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 w-full left-0 h-1 bg-gradient-brand"></div>
                
                <h3 className="font-display font-bold text-xl text-brand-dark mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Enter Details
                </h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Board</label>
                      <select 
                        className="input-field" 
                        value={form.board}
                        onChange={(e) => setForm({ ...form, board: e.target.value, studentClass: '', batch: '' })}
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="JAC">JAC</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Class</label>
                      <select className="input-field" value={form.studentClass} onChange={handleClassChange}>
                        <option value="">Select Class</option>
                        {BOARD_CLASSES[form.board]?.map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Course Category (Batch)</label>
                    <select className="input-field" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
                      <option value="">Select Course</option>
                      {['11', '12'].includes(form.studentClass) && (
                         <option value="Commerce Advance">Commerce Advance</option>
                      )}
                      {form.board === 'ICSE' && !['11', '12'].includes(form.studentClass) && (
                         <option value="ICSE-Advance">ICSE Advance</option>
                      )}
                      {form.board === 'CBSE' && !['11', '12'].includes(form.studentClass) && (
                         <>
                           <option value="Foundation">Foundation</option>
                           <option value="Advance">Advance</option>
                           {['9', '10'].includes(form.studentClass) && <option value="Math-Science">Math-Science Only</option>}
                         </>
                      )}
                    </select>
                    {!form.studentClass && (
                      <p className="text-xs text-amber-600 mt-1 italic">Select a class first</p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="label mb-0">SAT Score (%)</label>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {form.satScore}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      value={form.satScore}
                      onChange={(e) => setForm({ ...form, satScore: Number(e.target.value) })}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest px-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-3 flex items-start gap-2 text-xs text-blue-800">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Don't have a SAT score yet? Leave it at 0 to see the base fee. <Link to="/contact" className="font-bold underline text-blue-700">Register for SAT</Link>.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OUTPUT SECTION */}
            <div className="lg:col-span-7">
              {!form.studentClass || !form.batch ? (
                 <div className="bg-white/60 border border-dashed border-gray-200 rounded-3xl h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
                   <Calculator className="w-16 h-16 mb-4 opacity-20" />
                   <p className="font-medium max-w-sm">Please select your Board, Class, and Course Category to see the detailed fee breakdown.</p>
                 </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-card p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 relative border border-gray-50 flex flex-col h-full">
                  
                  {/* Summary Breakdown List */}
                  <div className="space-y-3 mb-6 flex-1">
                    <h3 className="font-display font-bold text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                      Fee Breakdown <ShieldCheck className="w-3.5 h-3.5" />
                    </h3>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium text-sm md:text-base">Base Tuition Fee</span>
                      <span className="font-bold text-brand-dark">₹{calculateFees.actualFee.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium text-sm md:text-base flex items-center gap-1.5 flex-col items-start">
                         <div className="flex items-center gap-1.5">
                           Registration & Admission
                           <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase">Fixed</span>
                         </div>
                         <span className="text-[10px] text-gray-400 italic mt-0.5 leading-snug">Registration fee may be waived in certain cases at admin's discretion.</span>
                      </span>
                      <span className="font-bold text-brand-dark">₹{calculateFees.admissionFee}</span>
                    </div>

                    {calculateFees.actualFee === 0 ? (
                      <div className="bg-amber-50 text-amber-700 p-4 rounded-xl mt-4 text-sm font-medium border border-amber-100">
                         The tuition fee for {form.batch} is currently unconfirmed. Please secure your estimate via WhatsApp below to receive the finalized pricing directly, or contact the branch.
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium text-sm md:text-base flex items-center gap-1.5">
                             SAT Scholarship <span className="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md text-[10px]">({calculateFees.satDiscountPercent.toFixed(1)}% OFF)</span>
                          </span>
                          <span className="font-bold text-green-600">- ₹{calculateFees.satDiscountAmount.toLocaleString('en-IN')}</span>
                        </div>

                        {calculateFees.plans[activePlan - 1]?.instDiscountAmount > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 animate-slide-up">
                            <span className="text-gray-600 font-medium text-sm md:text-base flex items-center gap-1.5">
                               Payment Plan Discount <span className="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md text-[10px]">({calculateFees.plans[activePlan - 1].instDiscountPercent}% OFF)</span>
                            </span>
                            <span className="font-bold text-green-600">- ₹{calculateFees.plans[activePlan - 1].instDiscountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Installment Selector & Final Total */}
                  <div className="bg-brand-bg border border-gray-100 rounded-2xl p-5 mb-8 opacity-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Choose Payment Plan</label>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[1, 2, 3].map(planNumber => (
                        <button 
                          key={planNumber}
                          onClick={() => setActivePlan(planNumber)}
                          disabled={calculateFees.actualFee === 0}
                          className={`py-2 px-1 text-xs md:text-sm font-bold rounded-xl transition-all border ${
                            activePlan === planNumber && calculateFees.actualFee !== 0
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {planNumber === 1 ? 'Full Payment' : `${planNumber} Installments`}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-gray-200/60">
                       <div>
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Final Amount</p>
                         <p className="text-sm text-gray-400">Everything Included</p>
                       </div>
                       <div className="text-left md:text-right">
                          <p className="text-4xl md:text-5xl font-display font-black text-brand-dark mb-1">
                             {calculateFees.actualFee === 0 ? 'TBA' : `₹${calculateFees.plans[activePlan - 1].payableAmount.toLocaleString('en-IN')}`}
                          </p>
                          {activePlan > 1 && calculateFees.actualFee > 0 && (
                            <p className="text-xs font-bold text-primary uppercase bg-primary/10 inline-block px-2 py-1 rounded-md">
                              Pay ₹{calculateFees.plans[activePlan - 1].installmentAmount.toLocaleString('en-IN')} × {activePlan}
                            </p>
                          )}
                       </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] sm:text-xs text-gray-400 mb-5 italic">
                    * Estimated Fee. Actual fee might vary slightly based on admin verification of your SAT score at the branch.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/contact#demo" className="btn-outline flex-1 flex justify-center items-center gap-2">
                       Book Demo Class <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to="/register" className="btn-primary flex-1 flex justify-center items-center gap-2">
                       Apply for Admission <CheckCircle className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* PRO LEVEL Auto Lead Capture */}
                  <div className="mt-8 border-t border-gray-100 pt-6">
                    {leadCaptured ? (
                      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-center gap-3 text-green-700 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-semibold">Number secured! Our counsellor will confirm exactly soon.</p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-2xl p-5">
                        <p className="text-sm font-bold text-brand-dark mb-1 flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary"/> Want exact confirmation?</p>
                        <p className="text-xs text-gray-500 mb-4">Enter your WhatsApp number and our counsellor will lock in this estimate for your admission.</p>
                        <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="tel" 
                            className="input-field flex-1 !bg-white !py-3" 
                            placeholder="Enter 10-digit number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            disabled={leadSubmitting}
                            required
                          />
                          <button 
                            type="submit" 
                            disabled={leadSubmitting || mobileNumber.length < 10}
                            className="btn-primary py-3 px-6 whitespace-nowrap disabled:opacity-50"
                          >
                            {leadSubmitting ? 'Securing...' : 'Secure Estimate'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
