import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import api from '../lib/api';

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

export default function Courses() {
  const [activeTab, setActiveTab] = useState('CBSE');
  const [syllabuses, setSyllabuses] = useState([]);
  const classes = activeTab === 'CBSE' ? cbseClasses : icseClasses;

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const res = await api.get('/syllabus');
        setSyllabuses(res.data.data || []);
      } catch (error) {
        console.error("Failed to load syllabus", error);
      }
    };
    fetchSyllabus();
  }, []);

  const getSyllabus = (board, className) => {
    const searchBoard = board.includes('CBSE') ? 'CBSE' : 'ICSE';
    return syllabuses.find(s => s.board === searchBoard && s.classLevel === className);
  };

  return (
    <div className="pt-36">
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
      <section className="section-pad bg-brand-bg">
        <div className="container-pad">
          {/* Board Filter Tabs */}
          <div className="flex justify-center gap-4 mb-10">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {classes.map((cls) => {
              const syllabus = getSyllabus(cls.board, cls.name);
              return (
              <div key={cls.name + cls.board} className="card p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glass">
                  <span className="text-white font-display font-bold text-lg">{cls.name}</span>
                </div>
                <h3 className="font-display font-bold text-brand-dark text-lg mb-2">
                  {cls.label}
                </h3>
                <p className="text-gray-500 text-sm mb-3 flex-grow">{cls.subjects}</p>
                <div className="flex items-center justify-between mt-auto mb-4">
                  <p className="text-xs text-primary font-semibold">Board: {cls.board}</p>
                  {syllabus && (
                     <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Updated</span>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  {syllabus ? (
                    <a href={syllabus.pdfUrl} target="_blank" rel="noreferrer" 
                       className="w-full py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:scale-[1.02]">
                      <FileText className="w-4 h-4" /> View Syllabus
                    </a>
                  ) : (
                    <button disabled className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-400 font-medium text-sm flex items-center justify-center gap-2 border border-dashed border-gray-200 cursor-not-allowed">
                       Syllabus will be available soon
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-brand text-center">
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
