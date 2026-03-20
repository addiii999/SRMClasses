import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please login.');
      setStep(1);
      setEmail(''); setOtp(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glass">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-brand-dark">SRM Classes</span>
          </Link>
          <h2 className="mt-6 text-3xl font-display font-bold text-brand-dark">
            {step === 1 ? 'Reset Password' : 'Enter OTP'}
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            {step === 1
              ? 'Enter your registered email and we\'ll send an OTP.'
              : `OTP sent to ${email}. Enter it below to reset your password.`}
          </p>
        </div>

        <div className="card p-8">
          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input-field" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? 'Sending OTP...' : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">6-Digit OTP</label>
                <input className="input-field tracking-widest text-center text-lg font-bold" placeholder="• • • • • •"
                  maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input-field" placeholder="At least 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input-field" placeholder="Re-enter password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 !mt-6">
                {loading ? 'Resetting...' : <><span>Reset Password</span><ArrowRight className="w-4 h-4" /></>}
              </button>
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-primary w-full transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
