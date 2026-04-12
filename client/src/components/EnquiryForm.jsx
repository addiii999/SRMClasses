import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function EnquiryForm() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    mobile: '', 
    schoolName: '',
    studentClass: '', 
    message: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill class from query param (e.g. /contact?class=10)
  useEffect(() => {
    const classParam = searchParams.get('class');
    if (classParam && ['5','6','7','8','9','10','11','12'].includes(classParam)) {
      setFormData(prev => ({ ...prev, studentClass: classParam }));
    }
  }, [searchParams]);

  const validate = () => {
    // School Name: letters and spaces only, min 3
    if (!/^[a-zA-Z\s]{3,}$/.test(formData.schoolName.trim())) {
      toast.error('School Name must be at least 3 characters and contain only letters.');
      return false;
    }
    // Mobile: 10 digits starting with 6-9
    if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6-9.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      // Trim values before sending
      const submissionData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        schoolName: formData.schoolName.trim(),
        message: formData.message.trim() || null
      };

      await api.post('/enquiries', submissionData);
      toast.success('Your enquiry has been submitted successfully');
      setFormData({ name: '', email: '', mobile: '', schoolName: '', studentClass: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-8 space-y-4">
      <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Send Enquiry</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="enquiry-name" className="label">Full Name <span className="text-red-500">*</span></label>
          <input 
            id="enquiry-name"
            name="name"
            className="input-field" 
            placeholder="Your name" 
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            required 
          />
        </div>
        <div>
          <label htmlFor="enquiry-mobile" className="label">Mobile <span className="text-red-500">*</span></label>
          <input 
            id="enquiry-mobile"
            name="mobile"
            className="input-field" 
            placeholder="10-digit number" 
            value={formData.mobile}
            onChange={e => setFormData({ ...formData, mobile: e.target.value })} 
            required 
          />
        </div>
      </div>

      <div>
        <label htmlFor="enquiry-email" className="label">Email <span className="text-red-500">*</span></label>
        <input 
          id="enquiry-email"
          name="email"
          type="email" 
          className="input-field" 
          placeholder="your@email.com" 
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })} 
          required 
        />
      </div>

      <div>
        <label htmlFor="enquiry-school" className="label">School Name <span className="text-red-500">*</span></label>
        <input 
          id="enquiry-school"
          name="schoolName"
          className="input-field" 
          placeholder="Enter your school name" 
          value={formData.schoolName}
          onChange={e => setFormData({ ...formData, schoolName: e.target.value })} 
          required 
        />
      </div>

      <div>
        <label htmlFor="enquiry-class" className="label">Class Interested In <span className="text-red-500">*</span></label>
        <select 
          id="enquiry-class"
          name="studentClass"
          className="input-field" 
          value={formData.studentClass}
          onChange={e => setFormData({ ...formData, studentClass: e.target.value })}
          required
        >
          <option value="">Select Class</option>
          {['5','6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="enquiry-message" className="label">Message (optional)</label>
        <textarea 
          id="enquiry-message"
          name="message"
          className="input-field resize-none" 
          rows={3} 
          placeholder="Any specific queries..." 
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })} 
        />
      </div>

      <button 
        type="submit" 
        disabled={submitting} 
        className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-[0.98]"
      >
        {submitting ? 'Submitting...' : <><span>Submit Enquiry</span><ArrowRight className="w-4 h-4" /></>}
      </button>

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
        {['Free counselling', 'Price details'].map(i => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
            <CheckCircle className="w-3 h-3 text-green-500" /> {i}
          </div>
        ))}
      </div>
    </form>
  );
}
