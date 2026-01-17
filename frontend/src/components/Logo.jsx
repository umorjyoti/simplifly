import React from 'react';

const Logo = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="/logo.svg" 
        alt="Simplifly Logo" 
        className={sizeClasses[size]}
      />
      {showText && (
        <span className="text-2xl font-bold text-primary-600">
          Simplifly
        </span>
      )}
    </div>
  );
};

export default Logo;
