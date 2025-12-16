"use client";

import { useEffect } from 'react';

const ClaimsDashboard = ({ currentTheme, preferences }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Claims Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Fidelity claims resolution and tracking system
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Active Claims</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>--</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Pending Review</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>--</p>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Exposure</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>--</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Settled Claims</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>--</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Module Description */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg`}>
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`}>
          Claims Management System
        </h2>
        <p className={`${currentTheme.textSecondary} mb-6 leading-relaxed`}>
          Comprehensive fidelity claims management system for tracking, evaluating, and resolving 
          staff-related insurance claims from client reports through to insurer settlement.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">⚖️</span>
              Claims Resolution
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Dashboard for active claims requiring action. Review, accept, decline, or file claims 
              with insurers in real-time.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Client-reported incidents</li>
              <li>SOL evaluation & decision-making</li>
              <li>Insurer filing & tracking</li>
              <li>Settlement processing</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📊</span>
              Claims Resolution List
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Complete archive of all claims with advanced filtering, search, and export capabilities.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Comprehensive claim history</li>
              <li>Advanced filtering & search</li>
              <li>Excel/PDF export</li>
              <li>Detailed claim tracking</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">🛡️</span>
              Policy Management
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Manage client fidelity insurance policies, coverage limits, and policy periods.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Set policy aggregate limits</li>
              <li>Configure single occurrence limits</li>
              <li>Track policy periods & renewals</li>
              <li>Manage insurer information</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
        <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard/admin#claims-resolution'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Active Claims
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/admin#claims-resolution-list'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Browse All Claims
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/admin#policy-management'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Manage Policies
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimsDashboard;
