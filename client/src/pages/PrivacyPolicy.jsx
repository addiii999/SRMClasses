import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Database, Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { CONTACT_NUMBERS } from '../config/contact';

export default function PrivacyPolicy() {
  // Use a static date to represent when it was actually last updated, 
  // but formatted nicely. For this specific request, we set it to today's date.
  const lastUpdated = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 'introduction',
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: 'Introduction',
      content: (
        <p className="text-gray-600 leading-relaxed">
          At <strong className="text-brand-dark">SRM Classes</strong>, we deeply respect your privacy. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our website, student portal, and educational services. Your data is collected exclusively for operational and academic purposes to ensure you receive the highest quality of learning.
        </p>
      )
    },
    {
      id: 'data-we-collect',
      icon: <Database className="w-6 h-6 text-primary" />,
      title: 'Data We Collect',
      content: (
        <div className="space-y-4 text-gray-600">
          <p>We may collect the following information when you interact with our platform:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {['Full Name', 'Phone Number', 'Email Address', 'Class & Academic Details', 'Payment Information (if applicable)'].map((item) => (
              <li key={item} className="flex items-center gap-3 bg-brand-bg/50 px-4 py-3 rounded-xl border border-primary/5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-brand-dark text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    },
    {
      id: 'how-we-use-data',
      icon: <EyeOff className="w-6 h-6 text-primary" />,
      title: 'How We Use Your Data',
      content: (
        <ul className="space-y-3 text-gray-600 list-inside">
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span><strong className="text-brand-dark font-medium">Student Management:</strong> To create and manage your academic profile, attendance, and test results.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span><strong className="text-brand-dark font-medium">Communication:</strong> To send important updates, syllabus changes, WhatsApp messages, and coordinate regarding demo classes.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span><strong className="text-brand-dark font-medium">Fee Tracking:</strong> To securely map and record your payment history and send fee reminders.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span><strong className="text-brand-dark font-medium">Improving Services:</strong> To analyze website performance and enhance the overall educational ecosystem.</span>
          </li>
        </ul>
      )
    },
    {
      id: 'data-security',
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: 'Data Security',
      content: (
        <p className="text-gray-600 leading-relaxed">
          Security is our top priority. Your data is securely encrypted and stored on our protected servers. We implement robust backend mechanisms and strict access control measures to ensure that your personal information is accessible <strong className="text-brand-dark">only by authorized administrators</strong> and is completely shielded from unauthorized third parties.
        </p>
      )
    },
    {
      id: 'data-sharing',
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: 'Data Sharing',
      content: (
        <p className="text-gray-600 leading-relaxed">
          <strong className="text-brand-dark font-bold">We do not sell, rent, or commercialize your physical or digital data.</strong> Your information remains strictly within the SRM Classes ecosystem. We may only disclose your data if legally required to do so by law enforcement or regulatory authorities.
        </p>
      )
    },
    {
      id: 'user-rights',
      icon: <Database className="w-6 h-6 text-primary" />,
      title: 'Your Rights',
      content: (
        <p className="text-gray-600 leading-relaxed">
          As a registered student or parent, you have the right to request a correction of your data if you spot any inaccuracies. Additionally, you may request the complete removal of your account and associated records by directly contacting the administration. Note that academic records aligned with our operational policy may be subject to standard retention cycles before permanent deletion.
        </p>
      )
    },
    {
      id: 'cookies',
      icon: <EyeOff className="w-6 h-6 text-primary" />,
      title: 'Cookies & Tracking',
      content: (
        <p className="text-gray-600 leading-relaxed">
          Our platform utilizes highly basic, minimal cookies to maintain local sessions (such as authentication tokens) ensuring you don't have to log in repeatedly. We use these solely for performance improvements and standard User Experience (UX) enhancements.
        </p>
      )
    },
    {
      id: 'children-privacy',
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: 'Children Privacy',
      content: (
        <p className="text-gray-600 leading-relaxed">
          Our platform is tailored for students (Class 6 - 12). We recognize the sensitive nature of student data and therefore manage all academic records securely under the assumption that guardians are aware of the student's enrollment at SRM Classes.
        </p>
      )
    }
  ];

  return (
    <div className="pt-24 pb-20 bg-[#fafbfe]">
      {/* Premium Header */}
      <div className="bg-brand-dark text-white pt-20 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 bg-center"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="container-pad relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-primary-light font-medium text-sm mb-6 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" /> Security & Trust
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Privacy Policy</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Your privacy matters to us at SRM Classes. Learn how we handle your data with integrity and professional care.
          </p>
        </div>
      </div>

      <div className="container-pad -mt-10 relative z-20">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Last Updated Badge */}
          <div className="flex justify-center -mt-6 mb-12">
            <div className="bg-white px-6 py-3 rounded-full shadow-glass border border-gray-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                Last Updated: <span className="text-brand-dark">{lastUpdated}</span>
              </span>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12 space-y-12">
            {sections.map((section, index) => (
              <div key={section.id} className="relative group">
                {/* Soft Divider (except first) */}
                {index !== 0 && (
                  <div className="absolute top-0 left-0 right-0 -mt-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  <div className="md:w-1/4 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-display font-bold text-brand-dark leading-tight">{section.title}</h3>
                  </div>
                  <div className="md:w-3/4 flex items-center">
                    {section.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-brand-dark rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 pattern-dots"></div>
             <div className="relative z-10">
               <h3 className="text-2xl font-display font-bold text-white mb-4">Have questions about your data?</h3>
               <p className="text-white/60 mb-10 max-w-lg mx-auto">
                 Our administration is always here to align with your inquiries regarding your data and privacy on the platform.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                 <a href="mailto:srmclasses01@gmail.com" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all group block">
                   <Mail className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                   <p className="text-sm font-medium text-white/80">Email Us</p>
                   <p className="text-xs text-white/50 mt-1">srmclasses01@gmail.com</p>
                 </a>
                 <a href={`tel:${CONTACT_NUMBERS[0]}`} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all group block">
                   <Phone className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                   <p className="text-sm font-medium text-white/80">Call Support</p>
                   <p className="text-xs text-white/50 mt-1">{CONTACT_NUMBERS[0]}</p>
                 </a>
                 <a href="https://maps.app.goo.gl/TFpjRggpozuA5TDPA" target="_blank" rel="noreferrer" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all group block">
                   <MapPin className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                   <p className="text-sm font-medium text-white/80">Location</p>
                   <p className="text-xs text-white/50 mt-1">Ranchi, Jharkhand</p>
                 </a>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
