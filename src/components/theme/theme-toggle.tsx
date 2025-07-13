'use client';

import { useTheme } from './theme-context';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative p-3 rounded-xl transition-all duration-300 ease-in-out
        ${theme === 'neon-tech' 
          ? 'bg-gray-800 border border-gray-600 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20' 
          : 'glass-button hover:scale-105'
        }
        ${isAnimating ? 'scale-95' : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
        ${theme === 'neon-tech' ? 'focus:ring-green-400' : 'focus:ring-white'}
      `}
      aria-label={`Switch to ${theme === 'neon-tech' ? 'liquid glass' : 'neon tech'} theme`}
      title={`Current: ${theme === 'neon-tech' ? 'Neon Tech' : 'Liquid Glass'} - Click to switch`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`
          w-6 h-6 rounded-lg transition-all duration-300
          ${theme === 'neon-tech' 
            ? 'bg-green-400 shadow-lg shadow-green-400/50' 
            : 'bg-gradient-to-br from-blue-400 to-purple-500 animate-gradient'
          }
          ${isAnimating ? 'rotate-180' : ''}
        `}>
          {theme === 'neon-tech' ? (
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          )}
        </div>
        
        {/* Theme Name */}
        <span className={`
          text-sm font-medium transition-all duration-300
          ${theme === 'neon-tech' 
            ? 'text-green-400' 
            : 'text-white'
          }
        `}>
          {theme === 'neon-tech' ? 'Neon Tech' : 'Liquid Glass'}
        </span>
      </div>

      {/* Animated Background Effect */}
      {theme === 'liquid-glass' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}

export function ThemeToggleCompact() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        w-10 h-10 rounded-lg transition-all duration-300 ease-in-out
        ${theme === 'neon-tech' 
          ? 'bg-gray-800 border border-gray-600 hover:border-green-400' 
          : 'glass-button hover:scale-110'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
        ${theme === 'neon-tech' ? 'focus:ring-green-400' : 'focus:ring-white'}
      `}
      aria-label={`Switch to ${theme === 'neon-tech' ? 'liquid glass' : 'neon tech'} theme`}
    >
      {theme === 'neon-tech' ? (
        <svg className="w-5 h-5 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      )}
    </button>
  );
}