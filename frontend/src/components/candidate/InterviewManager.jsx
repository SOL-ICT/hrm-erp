import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Video, Phone, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const InterviewManager = ({ candidate }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real interview data from API
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!candidate?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        
        // Get auth token from localStorage or session
        const authData = JSON.parse(localStorage.getItem('auth') || '{}');
        const token = authData.access_token;
        
        console.log('Auth data from localStorage:', authData); // Debug logging
        console.log('Token found:', token ? 'Yes' : 'No'); // Debug logging
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${apiUrl}/candidate-interviews`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('Interview API Response:', data); // Debug logging
        
        if (data.success && data.data) {
          console.log('Setting interviews:', data.data); // Debug logging
          setInterviews(data.data);
        } else {
          console.log('API response failed:', data); // Debug logging
          setError(data.message || 'Failed to fetch interviews');
        }
      } catch (err) {
        console.error('Error fetching interviews:', err);
        setError(err.message || 'Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [candidate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case 'virtual':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'physical':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleResponse = async (interviewId, response) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const token = authData.access_token;
      
      if (!token) {
        alert('Authentication required');
        return;
      }

      const apiResponse = await fetch(`${apiUrl}/candidate-interviews/${interviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          response: response,
          candidate_id: candidate?.id
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      
      if (result.success) {
        // Update local state
        setInterviews(prev => prev.map(interview => 
          interview.id === interviewId 
            ? { 
                ...interview, 
                candidate_response: response, 
                responded_at: new Date().toISOString(),
                status: response === 'accepted' ? 'confirmed' : 'declined'
              }
            : interview
        ));
        alert(`Interview ${response} successfully!`);
      } else {
        alert(result.message || 'Failed to respond to interview');
      }
    } catch (error) {
      console.error('Error responding to interview:', error);
      alert('Failed to respond to interview. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Invitations</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Invitations</h2>
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Invitations</h2>
      
      {interviews.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No interview invitations yet</p>
          <p className="text-sm text-gray-500 mt-1">
            You will be notified when employers invite you for interviews
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(interview.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{interview.position}</h3>
                    <p className="text-sm text-gray-600">{interview.client_name}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  interview.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : interview.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : interview.status === 'declined'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {interview.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(interview.interview_date)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(interview.interview_time)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {getInterviewTypeIcon(interview.interview_type)}
                  <span className="capitalize">{interview.interview_type} Interview</span>
                </div>
                {interview.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {interview.interview_type === 'virtual' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span className="truncate">
                      {interview.interview_type === 'virtual' ? 'Video Call Link' : interview.location}
                    </span>
                  </div>
                )}
              </div>

              {interview.message && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{interview.message}</p>
                </div>
              )}

              {interview.interview_type === 'virtual' && interview.location && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Link:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={interview.location}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(interview.location)}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {interview.status === 'pending' && !interview.candidate_response && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleResponse(interview.id, 'accepted')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Accept Interview
                  </button>
                  <button
                    onClick={() => handleResponse(interview.id, 'declined')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Decline Interview
                  </button>
                </div>
              )}

              {interview.candidate_response && (
                <div className="mt-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Your Response:</strong> You {interview.candidate_response} this interview invitation
                    {interview.responded_at && (
                      <span className="text-blue-600 ml-1">
                        on {new Date(interview.responded_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewManager;
