import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-3 justify-center">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm animate-pulse">
          {/* Header skeleton */}
          <div className="flex justify-between items-center px-4 pt-4">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>

          {/* Image skeleton */}
          <div className="mt-2 px-4">
            <div className="w-full h-36 bg-gray-200 rounded-md"></div>
          </div>

          {/* Title and description skeleton */}
          <div className="px-4 mt-2">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

          {/* Sponsor info skeleton */}
          <div className="px-4 mt-3">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>

          {/* Actions skeleton */}
          <div className="px-4 py-4">
            <div className="flex justify-between items-center gap-2 mb-2">
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;