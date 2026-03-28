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
      <section className="section-pad" style={{ backgroundColor: "#EAEFFE" }}>
        <div className="container-pad flex flex-col items-center">
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Card 1: CBSE */}
            <div className="p-6 rounded-xl bg-white text-[#2D274B] shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300" style={{ border: "1px solid #9787F3" }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#9787F3" }}>CBSE</h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Classes 5 to 10 (All Subjects)</li>
                <li>Class 11 &amp; 12 (Commerce Stream – All Subjects)</li>
                <li>Board: CBSE (5–10) + JAC (11–12)</li>
              </ul>
            </div>
            {/* Card 2: ICSE */}
            <div className="p-6 rounded-xl bg-white text-[#2D274B] shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300" style={{ border: "1px solid #9787F3" }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#9787F3" }}>ICSE</h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Classes 6 to 10 (All Subjects)</li>
              </ul>
            </div>
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
