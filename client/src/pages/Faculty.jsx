import { Star } from 'lucide-react';

const faculty = [
  { name: 'Mr. Ranjan Kumar Soni', subject: 'Mathematics & Physics', exp: '15 years + experience', qual: 'M.Sc. Mathematics, Founder', initial: 'R', speciality: 'Board Exam Specialist', rating: 5.0 },
  { name: 'Mr. Raghuwendra Kumar Soni', subject: 'Computer & AI', exp: '12 years + experience', qual: 'MCA, IT Expert', initial: 'R', speciality: 'Tech & AI Mentor', rating: 4.9 },
  { name: 'Mr. Yuvraj Kumar', subject: 'Chemistry & Physics', exp: '6 years + experience', qual: 'B.Sc. Physics, RU', initial: 'Y', speciality: 'Conceptual Science', rating: 4.8 },
  { name: 'Mrs. Priya Pandey', subject: 'Hindi & Sanskrit', exp: '8 Years', qual: 'M.A. Hindi, Ranchi University', initial: 'P', speciality: 'CBSE Hindi Expert', rating: 4.7 },
  { name: 'Mr. Vikash Gupta', subject: 'Computer Science', exp: '7 Years', qual: 'MCA, IGNOU', initial: 'V', speciality: 'Programming & Automation', rating: 4.8 },
  { name: 'Mr. Sunil Mahato', subject: 'Mathematics (Lower Classes)', exp: '9 Years', qual: 'B.Ed., Ranchi University', initial: 'S', speciality: 'Conceptual Mathematics', rating: 4.9 },
];

export default function Faculty() {
  return (
    <div className="pt-36">
      <section className="section-pad bg-gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="container-pad relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5">Our Expert Faculty</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">Meet the dedicated educators who have helped thousands of students achieve their academic goals.</p>
        </div>
      </section>

      <section className="section-pad bg-brand-bg">
        <div className="container-pad">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map(({ name, subject, exp, qual, initial, speciality, rating }) => (
              <div key={name} className="card p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white font-display font-bold text-3xl shadow-glass">
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-brand-dark mb-1">{name}</h3>
                <p className="text-primary text-sm font-semibold mb-1">{subject}</p>
                <p className="text-gray-400 text-xs mb-3">{qual}</p>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{rating}</span>
                </div>
                <div className="flex gap-3 justify-center">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exp}</span>
                  <span className="text-xs bg-brand-bg text-brand-dark px-3 py-1 rounded-full font-medium">{speciality}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
