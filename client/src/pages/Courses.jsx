import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, X, GraduationCap } from 'lucide-react';

const cbseClasses = [
  { name: '5', label: 'Class 5', subjects: 'All Subjects', board: 'CBSE' },
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'CBSE' },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'CBSE' },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'CBSE' },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'CBSE' },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'CBSE' },
  { name: '11', label: 'Class 11', subjects: 'Commerce – All Subjects', board: 'CBSE & JAC' },
  { name: '12', label: 'Class 12', subjects: 'Commerce – All Subjects', board: 'CBSE & JAC' },
];

const icseClasses = [
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'ICSE' },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'ICSE' },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'ICSE' },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'ICSE' },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'ICSE' },
];

const generalSubjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 
  'History', 'Civics', 'Geography', 'Economics', 
  'Computer Science & Artificial Intelligence', 'Hindi', 'English'
];

const commerceSubjects = [
  'Accountancy', 'Business Studies', 'Economics', 
  'Mathematics', 'Entrepreneurship'
];

function SubjectModal({ isOpen, onClose, classData }) {
  if (!isOpen || !classData) return null;

  // Determine which subjects to show based on class
  const isCommerce = classData.name === '11' || classData.name === '12';
  const subjects = isCommerce ? commerceSubjects : generalSubjects;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-glass-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass shrink-0">
               <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl text-brand-dark">Subjects Covered</h3>
              <p className="text-sm font-medium text-primary mt-1">{classData.board} • Class {classData.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-wrap gap-3">
            {subjects.map((subject, idx) => (
              <span 
                key={idx} 
                className="px-5 py-2.5 bg-primary/5 text-primary border border-primary/20 rounded-xl text-sm font-semibold shadow-sm hover:bg-primary hover:text-white transition-colors cursor-default"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400">SRM Classes Ranchi • Providing Premium Education</p>
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const [activeTab, setActiveTab] = useState('CBSE');
  const [selectedClass, setSelectedClass] = useState(null);
  
  const classes = activeTab === 'CBSE' ? cbseClasses : icseClasses;

  return (
    <div className="pt-36">
      <SubjectModal 
        isOpen={!!selectedClass} 
        onClose={() => setSelectedClass(null)} 
        classData={selectedClass} 
      />

      {/* Hero */}
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">Our Courses</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Comprehensive coaching for Class 5 to 12. Each course is designed with curated curriculum, experienced faculty, and structured batch timings.
          </p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="section-pad bg-brand-bg relative z-0">
        <div className="container-pad">
          {/* Board Filter Tabs */}
          <div className="flex justify-center gap-4 mb-10 relative z-10">
            {['CBSE', 'ICSE'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-brand text-white shadow-glass'
                    : 'bg-white text-brand-dark border border-primary/20 hover:border-primary/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {classes.map((cls) => {
              return (
              <div key={cls.name + cls.board} className="card p-6 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glass">
                  <span className="text-white font-display font-bold text-lg">{cls.name}</span>
                </div>
                <h3 className="font-display font-bold text-brand-dark text-lg mb-2">
                  {cls.label}
                </h3>
                <p className="text-gray-500 text-sm mb-3 flex-grow">{cls.subjects}</p>
                <div className="flex items-center justify-between mt-auto mb-4">
                  <p className="text-xs text-primary font-semibold border border-primary/20 px-2 py-1 rounded-md">Board: {cls.board}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setSelectedClass(cls)}
                    className="w-full py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-glass-lg transition-all hover:scale-[1.02]"
                  >
                    <BookOpen className="w-4 h-4" /> View Subjects
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-brand text-center relative z-0">
        <div className="container-pad">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Not Sure Which Course? Let Us Help.</h2>
          <p className="text-white/80 mb-6">Our academic counsellors will guide you to the perfect batch.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all shadow-glass-lg">
            Talk to a Counsellor
          </Link>
        </div>
      </section>
    </div>
  );
}
