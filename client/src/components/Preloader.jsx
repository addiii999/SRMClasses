import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

export default function Preloader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000); // Show for 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-brand-dark transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-glass-lg animate-logo-pulse shine-effect">
           <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-white" />
        </div>
        
        {/* Text Animation */}
        <div className="mt-8 text-center animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wider">
            SRM CLASSES
          </h1>
          <div className="mt-2 h-1 w-12 bg-primary mx-auto rounded-full overflow-hidden">
             <div className="h-full bg-white animate-[logo-shine_1.5s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}
