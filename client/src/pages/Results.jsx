import { useState, useEffect } from 'react';
import { Trophy, Star } from 'lucide-react';
import api from '../lib/api';

const staticResults = [
  { studentName: 'Priya Sharma', studentClass: '12', score: '95%', achievement: 'Board Topper – Science', year: '2024' },
  { studentName: 'Rahul Kumar', studentClass: '10', score: '97%', achievement: 'District Topper', year: '2024' },
  { studentName: 'Ananya Singh', studentClass: '12', score: 'AIR 4200', achievement: 'JEE Mains Qualified', year: '2024' },
  { studentName: 'Deepak Mahto', studentClass: '12', score: '92%', achievement: 'NEET Aspirant – 580/720', year: '2023' },
  { studentName: 'Neha Gupta', studentClass: '10', score: '98%', achievement: 'School Topper', year: '2023' },
  { studentName: 'Vikram Ojha', studentClass: '12', score: '89%', achievement: 'Commerce Topper', year: '2023' },
];

const classStat = [
  { class: 'Class 10', passRate: '100%', avg: '84%', topScore: '98%' },
  { class: 'Class 12 Sci', passRate: '100%', avg: '80%', topScore: '95%' },
  { class: 'Class 12 Com', passRate: '100%', avg: '78%', topScore: '89%' },
];

export default function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get('/results')
      .then(res => setResults(res.data.data?.length ? res.data.data : staticResults))
      .catch(() => setResults(staticResults));
  }, []);

  return (
    <div className="pt-28">
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">Our Results</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">Years of hard work, expert teaching, and dedicated students — reflected in our outstanding results.</p>
        </div>
      </section>

      {/* Stats summary */}
      <section className="py-12 bg-white">
        <div className="container-pad">
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {classStat.map(({ class: cls, passRate, avg, topScore }) => (
              <div key={cls} className="card p-6 text-center">
                <h3 className="font-display font-bold text-brand-dark text-lg mb-4">{cls}</h3>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {[['Pass Rate', passRate], ['Average', avg], ['Top Score', topScore]].map(([label, val]) => (
                    <div key={label} className="px-2">
                      <div className="text-xl font-display font-bold text-gradient">{val}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Toppers */}
          <div className="text-center mb-8">
            <h2 className="section-title">Our Star Achievers</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((r, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glass shrink-0">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-brand-dark">{r.studentName}</h4>
                    <p className="text-gray-400 text-xs mb-2">Class {r.studentClass} • {r.year}</p>
                    <div className="text-2xl font-display font-bold text-gradient">{r.score}</div>
                    <p className="text-primary text-xs font-medium mt-1">{r.achievement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Year wise */}
      <section className="section-pad bg-brand-bg">
        <div className="container-pad text-center">
          <h2 className="section-title mb-8">Year-over-Year Excellence</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['2024', '98%', '120 students'], ['2023', '97%', '105 students'], ['2022', '96%', '90 students'], ['2021', '95%', '75 students']].map(([year, rate, students]) => (
              <div key={year} className="card-glass text-center">
                <div className="text-4xl font-display font-bold text-brand-dark mb-1">{year}</div>
                <div className="text-2xl font-display font-bold text-gradient mb-1">{rate}</div>
                <div className="text-xs text-gray-400">Success Rate • {students}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
