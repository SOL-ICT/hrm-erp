"use client";

import dynamic from 'next/dynamic';

// Dynamically import the Next.js page component
const ClaimsResolutionPage = dynamic(
  () => import('@/app/admin/claims/resolution/page'),
  { ssr: false }
);

const ClaimsResolution = ({ currentTheme, preferences, onBack }) => {
  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <ClaimsResolutionPage />
    </div>
  );
};

export default ClaimsResolution;
