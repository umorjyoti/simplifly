import React from 'react';

const Logo = ({ className = '', showText = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className={`${sizeClasses[size]} bg-current flex items-center justify-center`}>
        <div className="w-[60%] h-[60%] border-2 border-white rotate-45"></div>
      </div>
      {showText && (
        <span className="text-2xl font-black uppercase tracking-tighter">
          Simplifly
        </span>
      )}
    </div>
  );
};

export default Logo;
