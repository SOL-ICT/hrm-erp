import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        // Get CSRF token
        await fetch('http://localhost:8000/sanctum/csrf-cookie', {
          credentials: 'include',
        });

        // Fetch all profiles
        const response = await fetch('http://localhost:8000/api/staff/staff-profiles', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
        });

        console.log('[FETCH] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            setErrorMessage('Authentication failed. Please log in again.');
          } else {
            setErrorMessage(`Failed to fetch profile: HTTP ${response.status}`);
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[FETCH] All profiles received:', data);

        const userProfile = Array.isArray(data) ? data[0] : data;

        if (userProfile && userProfile.staff_id) {
          const specificResponse = await fetch(`http://localhost:8000/api/staff/staff-profiles/${user?.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include',
          });

          if (specificResponse.ok) {
            const specificData = await specificResponse.json();
            console.log('[FETCH] Specific profile data:', specificData);
            setProfile(specificData);
          } else {
            setProfile(userProfile);
          }
        } else {
          setProfile(userProfile);
        }

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
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">My Profile</h2>

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
