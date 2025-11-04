import React from 'react';

/**
 * Skeleton Component
 * Loading placeholder component with pulse animation
 * 
 * @param {string} type - Type of skeleton: 'text', 'card', 'image', 'table' (default: 'text')
 * @param {number} count - Number of lines for text type (default: 3)
 */
const Skeleton = ({ type = 'text', count = 3 }) => {
  /**
   * Text skeleton - multiple lines
   */
  const TextSkeleton = () => (
    <div className="space-y-3">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded animate-pulse ${
            index === count - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );

  /**
   * Card skeleton - event card placeholder
   */
  const CardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-200"></div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        {/* Meta info */}
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Button */}
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );

  /**
   * Image skeleton - rectangular image placeholder
   */
  const ImageSkeleton = () => (
    <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
  );

  /**
   * Table skeleton - table row placeholder
   */
  const TableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="flex space-x-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );

  /**
   * Profile skeleton
   */
  const ProfileSkeleton = () => (
    <div className="flex items-center space-x-4 animate-pulse">
      {/* Avatar */}
      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
      
      {/* Info */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  // Render based on type
  switch (type) {
    case 'card':
      return <CardSkeleton />;
    case 'image':
      return <ImageSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'profile':
      return <ProfileSkeleton />;
    case 'text':
    default:
      return <TextSkeleton />;
  }
};

export default Skeleton;
