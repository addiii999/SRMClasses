import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight, Phone, ShieldCheck, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

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
  const [form, setForm] = useState({ name: '', studentClass: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [registering, setRegistering] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
    setRegistering(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email,
        studentClass: form.studentClass,
        password: form.password,
        otpToken,
      });
      login(res.data.user, res.data.token);
      toast.success('Account created! Welcome to SRM Classes 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      // If OTP token expired, send back to step 1
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
                <label className="label">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">+91</span>
                  <input
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
                <label className="label">Email <span className="text-gray-400 font-normal">(OTP will be sent here)</span></label>
                <input
                  type="email"
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

              <div>
                <label className="label">Full Name</label>
                <input
                  className="input-field"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Your Class</label>
                <select
                  className="input-field"
                  value={form.studentClass}
                  onChange={e => setForm({ ...form, studentClass: e.target.value })}
                  required
                >
                  <option value="">Select your class</option>
                  {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="At least 6 characters"
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
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={registering}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 !mt-6"
              >
                {registering ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Creating Account...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Create Account</>
                )}
              </button>
            </form>
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
