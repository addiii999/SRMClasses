import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight, Phone, ShieldCheck, CheckCircle, RefreshCw, AlertCircle, Clock, Home, User, BookOpen } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { fetchBoardClassMap, getAllowedBoardsForClass } from '../utils/boardConstraints';

// ── Step Indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current }) => {
  const steps = [
    { n: 1, label: 'Phone' },
    { n: 2, label: 'Verify OTP' },
    { n: 3, label: 'Details' },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${current > s.n ? 'bg-green-500 text-white' : current === s.n ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30 scale-110' : 'bg-gray-100 text-gray-400'}`}>
              {current > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-[10px] font-semibold ${current >= s.n ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 mb-4 mx-1 transition-all duration-300 ${current > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── OTP Input (6 individual boxes) ───────────────────────────────────────────
const OTPInput = ({ otp, setOTP }) => {
  const refs = useRef([]);
  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOTP(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOTP(text.split(''));
      refs.current[5]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {otp.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(e.target.value, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
            ${d ? 'border-primary bg-primary/5 text-brand-dark' : 'border-gray-200 bg-white text-brand-dark'}
            focus:border-primary focus:ring-2 focus:ring-primary/20`}
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Register() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);

  // Step 2 state
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');

  // Step 3 state
  const [form, setForm] = useState({
    name: '', studentClass: '', board: '', branch: '',
    password: '', confirmPassword: '',
    parentName: '', parentContact: '',
    schoolName: '', address: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchError, setBranchError] = useState('');
  const [boardClassMap, setBoardClassMap] = useState({});

  const navigate = useNavigate();

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        setBranches(res.data.data.filter(b => b.isActive));
      } catch (err) {
        setBranchError('Unable to load branches, please refresh');
      }
    };
    const initConfigs = async () => {
      fetchBranches();
      const map = await fetchBoardClassMap();
      if (map) setBoardClassMap(map);
    };
    initConfigs();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c <= 1 ? (clearInterval(t), 0) : c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // ── Validate phone ──────────────────────────────────────────────────────────
  const validatePhone = (num) => {
    if (!/^\d{10}$/.test(num)) return 'Please enter a valid 10-digit number';
    if (/^(\d)\1{9}$/.test(num)) return 'Please enter a real phone number';
    return null;
  };

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    const phoneErr = validatePhone(mobile);
    if (phoneErr) { toast.error(phoneErr); return; }
    if (!email) { toast.error('Email is required to receive your OTP'); return; }
    setSendingOTP(true);
    try {
      await api.post('/auth/send-otp', { mobile, email });
      toast.success(`OTP sent to ${email.replace(/(.{2}).+(@.+)/, '$1***$2')}`);
      setStep(2);
      setCooldown(60);
      setOtpError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      const wait = err.response?.data?.waitSeconds;
      if (wait) setCooldown(wait);
      toast.error(msg);
    } finally {
      setSendingOTP(false);
    }
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return; }
    setVerifying(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp: code });
      setOtpToken(res.data.otpToken);
      toast.success('Phone verified! ✅');
      setStep(3);
    } catch (err) {
      const data = err.response?.data;
      setOtpError(data?.message || 'Invalid OTP');
      if (data?.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
      if (data?.expired || data?.blocked) {
        setOTP(['', '', '', '', '', '']);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (step === 2 && otp.every(d => d !== '')) {
      handleVerifyOTP();
    }
  }, [otp]);

  // ── Step 3: register ────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (!/\d/.test(form.password)) { toast.error('Password must contain at least 1 number'); return; }
    if (!form.parentName.trim()) { toast.error('Parent name is required'); return; }
    if (!/^[6-9]\d{9}$/.test(form.parentContact)) { toast.error('Enter a valid 10-digit parent contact number'); return; }
    if (mobile === form.parentContact) { toast.error('Student mobile and parent contact cannot be the same'); return; }

    setRegistering(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email,
        studentClass: form.studentClass,
        board: form.board,
        branch: form.branch,
        password: form.password,
        otpToken,
        parentName: form.parentName,
        parentContact: form.parentContact,
        schoolName: form.schoolName || undefined,
        address: form.address || undefined,
      });
      // ✅ Registration submitted — NO auto-login, show pending screen
      toast.success('Registration submitted successfully!');
      setStep(4); // success/pending step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      if (err.response?.status === 401) {
        setStep(1);
        setOTP(['', '', '', '', '', '']);
        setOtpToken('');
        toast.error('Session expired. Please verify your phone again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-8 pt-36">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glass">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-brand-dark">SRM Classes</span>
          </Link>
          <h2 className="mt-4 text-3xl font-display font-bold text-brand-dark">Create your account</h2>
          <p className="mt-1 text-gray-500 text-sm">Join 2,500+ students on their journey to excellence</p>
        </div>

        <StepIndicator current={step} />

        <div className="card p-8">

          {/* ── STEP 1: Phone + Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark">Verify your phone</h3>
                  <p className="text-xs text-gray-400">We'll send a 6-digit OTP to your email</p>
                </div>
              </div>

              <div>
                <label htmlFor="reg-mobile" className="label">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">+91</span>
                  <input
                    id="reg-mobile"
                    name="mobile"
                    autoComplete="tel"
                    className="input-field pl-12"
                    placeholder="10-digit number"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="label">Email <span className="text-gray-400 font-normal">(OTP will be sent here)</span></label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sendingOTP || mobile.length !== 10}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 !mt-6"
              >
                {sendingOTP ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP...</>
                ) : (
                  <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-brand-dark text-lg">Enter your OTP</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sent to <span className="font-semibold text-primary">{email.replace(/(.{2}).+(@.+)/, '$1***$2')}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Valid for 5 minutes</p>
              </div>

              <OTPInput otp={otp} setOTP={setOTP} />

              {otpError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {remainingAttempts < 3 && remainingAttempts > 0 && (
                <p className="text-center text-xs text-orange-500 font-medium">
                  ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                </p>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.join('').length !== 6}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {verifying ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Verify OTP</>
                )}
              </button>

              {/* Resend */}
              <div className="text-center">
                {cooldown > 0 ? (
                  <p className="text-xs text-gray-400">
                    Resend OTP in <span className="font-bold text-primary">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOTP}
                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>

              <button onClick={() => { setStep(1); setOtpError(''); setOTP(['','','','','','']); }} className="text-xs text-gray-400 hover:text-gray-600 mx-auto block">
                ← Change phone / email
              </button>
            </div>
          )}

          {/* ── STEP 3: Account Details ── */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mb-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-700">Phone Verified!</p>
                  <p className="text-[11px] text-green-600">+91 {mobile} is confirmed</p>
                </div>
              </div>

              {/* ── Personal Info ── */}
              <div className="font-semibold text-brand-dark text-sm flex items-center gap-2 pb-1 border-b border-gray-100">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </div>

              <div>
                <label htmlFor="reg-name" className="label">Full Name</label>
                <input
                  id="reg-name"
                  name="name"
                  autoComplete="name"
                  className="input-field"
                  placeholder="Your full name (letters only)"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* ── Academic Info ── */}
              <div className="font-semibold text-brand-dark text-sm flex items-center gap-2 pb-1 border-b border-gray-100 !mt-5">
                <BookOpen className="w-4 h-4 text-primary" /> Academic Details
              </div>

              <div>
                <label htmlFor="reg-branch" className="label">Branch</label>
                {branchError ? (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">{branchError}</div>
                ) : (
                  <select
                    id="reg-branch"
                    name="branch"
                    className="input-field"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    required
                  >
                    <option value="">Select your branch</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-board" className="label">Board</label>
                  <select
                    id="reg-board"
                    name="board"
                    className="input-field"
                    value={form.board}
                    onChange={e => setForm({ ...form, board: e.target.value, studentClass: '' })}
                    required
                  >
                    <option value="">Select Board</option>
                    {Object.keys(boardClassMap).length > 0 ? 
                      Object.keys(boardClassMap).filter(b => {
                        if (!form.studentClass) return true;
                        return boardClassMap[b].includes(String(form.studentClass));
                      }).map(b => <option key={b} value={b}>{b}</option>)
                      : ['CBSE', 'ICSE', 'JAC'].map(b => <option key={b} value={b}>{b}</option>)
                    }
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-class" className="label">Your Class</label>
                  <select
                    id="reg-class"
                    name="studentClass"
                    className="input-field"
                    value={form.studentClass}
                    onChange={e => setForm({ ...form, studentClass: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    {['5','6','7','8','9','10','11','12'].filter(c => {
                      if (!form.board || !boardClassMap[form.board]) return true;
                      return boardClassMap[form.board].includes(String(c));
                    }).map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reg-school" className="label">School Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  id="reg-school"
                  name="schoolName"
                  className="input-field"
                  placeholder="Your current school name"
                  value={form.schoolName}
                  onChange={e => setForm({ ...form, schoolName: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="reg-address" className="label">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  id="reg-address"
                  name="address"
                  className="input-field"
                  placeholder="Your home address"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* ── Parent Info ── */}
              <div className="font-semibold text-brand-dark text-sm flex items-center gap-2 pb-1 border-b border-gray-100 !mt-5">
                <Phone className="w-4 h-4 text-primary" /> Parent / Guardian Details
              </div>

              <div>
                <label htmlFor="reg-parent-name" className="label">Parent / Guardian Name</label>
                <input
                  id="reg-parent-name"
                  name="parentName"
                  className="input-field"
                  placeholder="Parent's full name"
                  value={form.parentName}
                  onChange={e => setForm({ ...form, parentName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="reg-parent-contact" className="label">Parent Contact Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">+91</span>
                  <input
                    id="reg-parent-contact"
                    name="parentContact"
                    autoComplete="tel"
                    className={`input-field pl-12 ${form.parentContact && form.parentContact === mobile ? 'border-red-400 bg-red-50' : ''}`}
                    placeholder="Parent's 10-digit number"
                    value={form.parentContact}
                    onChange={e => setForm({ ...form, parentContact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </div>
                {form.parentContact && form.parentContact === mobile && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Parent contact cannot be same as student mobile
                  </p>
                )}
              </div>

              {/* ── Password ── */}
              <div className="font-semibold text-brand-dark text-sm flex items-center gap-2 pb-1 border-b border-gray-100 !mt-5">
                🔐 Set Password
              </div>

              <div>
                <label htmlFor="reg-password" title="At least 6 characters with 1 number" className="label">Password <span className="text-gray-400 font-normal text-xs">(min 6 chars, 1 number required)</span></label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="input-field pr-12"
                    placeholder="At least 6 characters with 1 number"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="label">Confirm Password</label>
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="input-field"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={registering || (form.parentContact && form.parentContact === mobile)}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 !mt-6"
              >
                {registering ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting Registration...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Submit Registration</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-2">
                ⏳ Your account will be reviewed by an admin before you can login.
              </p>
            </form>
          )}

          {/* ── STEP 4: Pending Approval ── */}
          {step === 4 && (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-dark font-display">Registration Submitted!</h3>
                <p className="text-gray-500 text-sm mt-2">
                  Your registration is <strong className="text-amber-600">pending admin approval</strong>.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  You will receive a notification once your account is approved. Then you can login.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
                <p className="text-sm font-semibold text-amber-700">What happens next?</p>
                <ul className="text-xs text-amber-600 space-y-1">
                  <li>✅ Admin reviews your registration</li>
                  <li>✅ You get an email notification on approval</li>
                  <li>✅ Login becomes available after approval</li>
                </ul>
              </div>

              <Link to="/login"
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Go to Login
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
