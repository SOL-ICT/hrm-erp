import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // update path if needed
import apiService from '@/services/api';

export default function useStaffProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Ensure CSRF cookie (safe no-op for GETs)
        await apiService.makeRequest('sanctum/csrf-cookie');

        // Use centralized API service which returns parsed JSON or throws on errors
        const data = await apiService.makeRequest('staff/staff-profiles/me', { method: 'GET' });

        // Defensive handling: backend sometimes returns an array — pick first item
        if (Array.isArray(data)) {
          setProfile(data[0] || null);
        } else {
          setProfile(data || null);
        }

      } catch (e) {
        if (e?.message && e.message.toLowerCase().includes('401')) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError('An error occurred while fetching the profile.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  return { profile, isLoading, error };
}