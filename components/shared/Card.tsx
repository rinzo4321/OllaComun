
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'lg'
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div 
      className={`
        bg-white 
        rounded-2xl 
        shadow-lg 
        border border-gray-100
        ${paddingClasses[padding]}
        ${hover ? 'transition-all duration-300 hover:shadow-xl hover:scale-[1.01]' : 'transition-shadow duration-200'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
