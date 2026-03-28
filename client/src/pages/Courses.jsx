import { useState } from 'react';
import { Link } from 'react-router-dom';

const cbseClasses = [
  { name: '5', label: 'Class 5', subjects: 'All Subjects', board: 'CBSE' },
  { name: '6', label: 'Class 6', subjects: 'All Subjects', board: 'CBSE' },
  { name: '7', label: 'Class 7', subjects: 'All Subjects', board: 'CBSE' },
  { name: '8', label: 'Class 8', subjects: 'All Subjects', board: 'CBSE' },
  { name: '9', label: 'Class 9', subjects: 'All Subjects', board: 'CBSE' },
  { name: '10', label: 'Class 10', subjects: 'All Subjects', board: 'CBSE' },
  { name: '11', label: 'Class 11', subjects: 'Commerce – All Subjects', board: 'JAC' },
  { name: '12', label: 'Class 12', subjects: 'Commerce – All Subjects', board: 'JAC' },
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
  const classes = activeTab === 'CBSE' ? cbseClasses : icseClasses;

  return (
    <div className="pt-20">
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
            {classes.map((cls) => (
              <div key={cls.name + cls.board} className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glass">
                  <span className="text-white font-display font-bold text-lg">{cls.name}</span>
                </div>
                <h3 className="font-display font-bold text-brand-dark text-lg mb-2">
                  {cls.label}
                </h3>
                <p className="text-gray-500 text-sm mb-3">{cls.subjects}</p>
                <p className="text-xs text-primary font-semibold">Board: {cls.board}</p>
              </div>
            ))}
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
