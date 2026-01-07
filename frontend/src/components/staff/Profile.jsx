import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { apiService } from "@/services/api";


const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();


useEffect(() => {
  console.log('[DEBUG] API_BASE_URL =', API_BASE_URL);
}, []);



  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        // Fire-and-forget CSRF token prefetch. Don't block profile fetch if it fails.
        apiService.makeRequest('/sanctum/csrf-cookie').catch((err) => {
          console.warn('CSRF prefetch failed (ignored):', err?.message || err);
        });

        // Fetch the authenticated user's profile via the `/me` endpoint
        const data = await apiService.makeRequest('/staff/staff-profiles/me');
        console.log('[FETCH] My profile received:', data);
        setProfile(data || null);

      } catch (error) {
        console.error('[FETCH] Error fetching profile:', error);
        if (!errorMessage) {
          setErrorMessage('An error occurred while fetching the profile.');
        }
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Profile</h2>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-300">Loading profile data...</p>
        </div>
      ) : profile ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Profile Information</h3>
          <div className="space-y-3">
            {Object.entries(profile).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-1/3 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-black dark:text-white w-2/3">
                  {value || 'N/A'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Raw JSON Response:</h4>
            <pre className="bg-white dark:bg-gray-900 text-black dark:text-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border border-gray-300 dark:border-gray-700">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-300">No profile data found.</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
