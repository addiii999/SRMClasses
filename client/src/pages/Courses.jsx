import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, X, GraduationCap, Clock } from 'lucide-react';
import api from '../lib/api';

function SubjectModal({ isOpen, onClose, courseData }) {
  if (!isOpen || !courseData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-glass-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass shrink-0">
               <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl text-brand-dark">Subjects Covered</h3>
              <p className="text-sm font-medium text-primary mt-1">{courseData.board} • Class {courseData.className}</p>
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
          <div className="flex flex-wrap gap-3 mb-6">
            {(courseData.subjects || []).length > 0 ? (
              courseData.subjects.map((subject, idx) => (
                <span 
                  key={idx} 
                  className="px-5 py-2.5 bg-primary/5 text-primary border border-primary/20 rounded-xl text-sm font-semibold shadow-sm hover:bg-primary hover:text-white transition-colors cursor-default"
                >
                  {subject}
                </span>
              ))
            ) : (
              <span className="text-gray-500 italic text-sm">All general subjects covered</span>
            )}
          </div>

          {(courseData.batchTimings || []).length > 0 && (
             <div>
                <h4 className="font-bold text-brand-dark mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Batch Timings</h4>
                <div className="flex flex-wrap gap-2">
                  {courseData.batchTimings.map((time, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium">
                      {time}
                    </span>
                  ))}
                </div>
             </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400">SRM Classes Ranchi • {courseData.duration || '1 Year'} Program</p>
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const [activeTab, setActiveTab] = useState('CBSE');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);
  
  // Filter courses by selected tab (CBSE/ICSE)
  // Treat "Both" or "All" as available in both tabs
  const filteredCourses = courses.filter(c => {
    if (!c.board) return activeTab === 'CBSE'; // default fallback
    const boardUpper = c.board.toUpperCase();
    if (boardUpper === 'BOTH' || boardUpper === 'ALL') return true;
    return boardUpper.includes(activeTab);
  });

  return (
    <div className="pt-36">
      <SubjectModal 
        isOpen={!!selectedCourse} 
        onClose={() => setSelectedCourse(null)} 
        courseData={selectedCourse} 
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
      <section className="section-pad bg-brand-bg relative z-0 min-h-[400px]">
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
          
          {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
             </div>
          ) : filteredCourses.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm relative z-10">
               <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-gray-500">No courses found for {activeTab}</h3>
               <p className="text-gray-400 mt-2">Courses will appear here once added from the admin panel.</p>
             </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {filteredCourses.map((cls) => (
                <div key={cls._id} className="card p-6 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-glass">
                    <span className="text-white font-display font-bold text-lg">{cls.className}</span>
                  </div>
                  <h3 className="font-display font-bold text-brand-dark text-lg mb-2">
                    Class {cls.className}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3 flex-grow line-clamp-2">
                    {cls.subjects && cls.subjects.length > 0 ? cls.subjects.join(', ') : 'All Subjects'}
                  </p>
                  <div className="flex items-center justify-between mt-auto mb-4">
                    <p className="text-[10px] text-primary font-bold uppercase border border-primary/20 px-2 py-1 rounded-md">{cls.board || 'CBSE'}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setSelectedCourse(cls)}
                      className="w-full py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-glass-lg transition-all hover:scale-[1.02]"
                    >
                      <BookOpen className="w-4 h-4" /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
