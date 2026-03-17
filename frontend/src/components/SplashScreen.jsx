import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 1000);
          return 100;
        }
        const diff = Math.random() * 15;
        return Math.min(oldProgress + diff, 100);
      });
    }, 100);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#050b18] flex items-center justify-center overflow-hidden font-sans z-[9999]">
      {/* Background with Grain Texture */}
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }} />
      <div className="absolute inset-0 bg-radial-at-c from-[#0a1b3d] via-[#050b18] to-[#02050c]" />
      
      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center scale-90 md:scale-100">
        
        {/* Main Logo Box */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          
          {/* Golden Outer Frame (Squircle) */}
          <div className="absolute inset-0 rounded-[60px] border-[5px] border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.2),inset_0_0_15px_rgba(212,175,55,0.3)] overflow-hidden">
             {/* Frame Highlight Sweep */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full animate-frame-shine" />
          </div>

          {/* Inner Logo Group */}
          <div className="relative flex flex-col items-center">
            
            {/* Top Chevrons (Arrows) */}
            <div className="absolute -top-14 animate-in slide-in-from-bottom-4 duration-1000">
              <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
                <path d="M10 50L50 10L90 50" stroke="#d4af37" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M25 50L50 25L75 50" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
              </svg>
            </div>

            {/* Silver "DF" Letters */}
            <div className="relative flex items-center justify-center px-6 overflow-hidden">
              <h1 className="text-[10rem] font-black italic tracking-tighter leading-none select-none filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)]"
                  style={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #E5E7EB 40%, #9CA3AF 45%, #FFFFFF 50%, #D1D5DB 80%, #4B5563 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                DF
              </h1>
              
              {/* Metallic Glint Sweep */}
              <div className="absolute inset-0 -translate-x-full animate-text-glint pointer-events-none">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg]" />
              </div>
            </div>

            {/* Bottom Swooshes & Base Line */}
            <div className="absolute -bottom-8 w-full flex flex-col items-center">
              {/* Golden Base Line */}
              <div className="w-48 h-[3px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
              
              <div className="flex justify-between w-full mt-1">
                {/* Left Swoosh */}
                <svg width="60" height="30" viewBox="0 0 60 30" fill="none" className="rotate-[10deg]">
                   <path d="M55 5Q30 5 5 25" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" />
                   <path d="M50 12Q30 12 10 25" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
                </svg>
                {/* Right Swoosh */}
                <svg width="60" height="30" viewBox="0 0 60 30" fill="none" className="-rotate-[10deg]">
                   <path d="M5 5Q30 5 55 25" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" />
                   <path d="M10 12Q30 12 50 25" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Loading Indicator */}
        <div className="mt-24 w-64 md:w-80 flex flex-col items-center">
          <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#d4af37] transition-all duration-300 ease-linear shadow-[0_0_10px_#d4af37]"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="mt-4 flex flex-col items-center space-y-1">
            <span className="text-[10px] uppercase tracking-[0.5em] text-[#d4af37] font-bold">
              Establishing Secure Connection
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {Math.floor(loadingProgress)}%
            </span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes text-glint {
          0% { transform: translateX(-150%) skewX(-25deg); }
          25%, 100% { transform: translateX(250%) skewX(-25deg); }
        }
        @keyframes frame-shine {
          0% { transform: translateX(-150%) skewX(-25deg); }
          30%, 100% { transform: translateX(250%) skewX(-25deg); }
        }
        .animate-text-glint {
          animation: text-glint 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-frame-shine {
          animation: frame-shine 6s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
