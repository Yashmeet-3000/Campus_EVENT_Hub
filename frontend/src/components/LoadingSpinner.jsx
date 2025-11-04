import React from 'react';

/**
 * LoadingSpinner Component
 * Reusable loading spinner with optional message and size variations
 * 
 * @param {string} message - Optional loading text (default: "Loading...")
 * @param {string} size - Size variation: 'sm', 'md', 'lg' (default: 'md')
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  // Size configurations
  const sizeClasses = {
    sm: {
      spinner: 'h-8 w-8',
      text: 'text-sm'
    },
    md: {
      spinner: 'h-12 w-12',
      text: 'text-base'
    },
    lg: {
      spinner: 'h-16 w-16',
      text: 'text-lg'
    }
  };

  const { spinner, text } = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Spinning circle */}
      <div className={`${spinner} animate-spin rounded-full border-t-4 border-b-4 border-blue-600`}></div>
      
      {/* Loading message */}
      {message && (
        <p className={`mt-4 ${text} text-gray-600 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
