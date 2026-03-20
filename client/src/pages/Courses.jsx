import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import api from '../lib/api';

const classColors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-yellow-100 text-yellow-700', 'bg-cyan-100 text-cyan-700', 'bg-rose-100 text-rose-700'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses')
      .then(res => setCourses(res.data.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

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
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-200 rounded mb-2 w-2/3" />
                  <div className="h-4 bg-gray-100 rounded mb-1 w-full" />
                  <div className="h-4 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course, i) => (
                <div key={course._id} className="card p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glass">
                      <span className="text-white font-display font-bold text-2xl">{course.className}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${classColors[i % classColors.length]}`}>
                      Class {course.className}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-dark text-lg mb-1">Class {course.className} Program</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                      <Clock className="w-3.5 h-3.5" /> {course.duration}
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-500 text-xs mb-3">
                      <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{course.subjects?.join(', ')}</span>
                    </div>
                    {course.batchTimings?.length > 0 && (
                      <div className="space-y-1">
                        {course.batchTimings.map((timing, j) => (
                          <div key={j} className="text-xs bg-primary/5 text-primary font-medium px-3 py-1.5 rounded-lg">{timing}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link to="/contact#demo" className="btn-primary text-sm py-2.5 text-center mt-auto flex items-center justify-center gap-1.5">
                    Book Demo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
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
