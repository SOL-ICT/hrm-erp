import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, CheckCircle, AlertCircle, Play, Pause, 
  ChevronLeft, ChevronRight, Send, Eye, Calendar, Award 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const TestCenter = ({ candidateProfile, currentTheme, onClose }) => {
  const { sanctumRequest } = useAuth();
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testPaused, setTestPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real data from API
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        console.log('🧪 Fetching candidate tests...');

        // Get auth token for debugging
        let token = null;
        try {
          const authData = JSON.parse(localStorage.getItem('auth') || '{}');
          token = authData.access_token;
        } catch (e) {
          token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        }

        console.log('🔐 Token available for tests:', !!token);

        // Try multiple test endpoints to find the right one
        const endpoints = [
          '/api/candidate/tests/available', // Direct test assignments - most relevant and WORKING!
          '/api/my-applications'  // Fallback to applications
        ];

        let testsFound = false;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔍 Trying test endpoint: ${endpoint}`);
            const response = await sanctumRequest(endpoint);
            
            console.log(`📡 Test endpoint ${endpoint} response:`, {
              ok: response.ok,
              status: response.status
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`📊 Test data from ${endpoint}:`, data);
              
              if (data.success && data.data) {
                // Handle different response structures
                if (Array.isArray(data.data)) {
                  // If this is the candidate/tests/available endpoint
                  if (endpoint === '/api/candidate/tests/available') {
                    console.log('🧪 Found test assignments from API:', data.data);
                    const testsFromAssignments = data.data.map(assignment => ({
                      id: assignment.id,
                      title: assignment.test?.title ? `${assignment.test.title} Test` : `Test Assignment #${assignment.id}`,
                      description: assignment.invitation_message || assignment.test?.description || 'Assessment test invitation',
                      applicationId: assignment.recruitment_request_id,
                      testId: assignment.test_id,
                      status: assignment.status,
                      assignedAt: assignment.assigned_at,
                      expiresAt: assignment.expires_at,
                      startedAt: assignment.started_at,
                      completedAt: assignment.completed_at,
                      ticketId: assignment.recruitment_request?.ticket_id,
                      company: assignment.recruitment_request?.client?.name || 'N/A',
                      jobTitle: assignment.recruitment_request?.job_structure?.job_title || 'Position',
                      deadline: assignment.expires_at ? new Date(assignment.expires_at).toLocaleString() : 'TBD',
                      questions: assignment.test?.total_questions || 10,
                      timeLimit: assignment.test?.time_limit || 45,
                      type: 'Assessment',
                      isExpired: assignment.is_expired || (assignment.expires_at ? new Date(assignment.expires_at) < new Date() : false)
                    }));
                    setPendingTests(testsFromAssignments);
                    testsFound = true;
                    console.log(`✅ Found ${testsFromAssignments.length} test assignments from API`);
                    break;
                  }
                  // If this is the my-applications endpoint, filter for test-related statuses
                  else if (endpoint === '/api/my-applications') {
                    const testApplications = data.data.filter(app => 
                      app.status && 
                      (app.status.includes('test') || app.status === 'test_sent')
                    );
                    if (testApplications.length > 0) {
                      console.log('🧪 Found test applications:', testApplications);
                      // Transform applications into test format
                      const testsFromApplications = testApplications.map(app => ({
                        id: `app_${app.id}`,
                        title: `${app.position_title} - Assessment Test`,
                        description: `Test for ${app.position_title} position at ${app.company}`,
                        applicationId: app.id,
                        status: app.status,
                        ticketId: app.ticket_id,
                        company: app.company,
                        sentAt: app.applied_at,
                        lastStatusChange: app.last_status_change,
                        deadline: '24 hours', // Default - could be configured
                        questions: 10, // Default - could come from API
                        timeLimit: 60, // Default - could come from API
                        type: 'Assessment',
                        isExpired: false // Would need to calculate based on deadline
                      }));
                      setPendingTests(testsFromApplications);
                      testsFound = true;
                      console.log(`✅ Found ${testsFromApplications.length} test assignments from applications`);
                      break;
                    } else {
                      console.log('⚠️ No applications with test status found');
                    }
                  } else {
                    setPendingTests(data.data);
                    testsFound = true;
                    console.log(`✅ Found ${data.data.length} tests from ${endpoint}`);
                    break;
                  }
                } else if (data.data.available) {
                  setPendingTests(data.data.available);
                  testsFound = true;
                  console.log(`✅ Found ${data.data.available.length} available tests from ${endpoint}`);
                  break;
                }
              }
            }
          } catch (endpointError) {
            console.log(`❌ Error with endpoint ${endpoint}:`, endpointError.message);
          }
        }

        if (!testsFound) {
          console.log('⚠️ No tests found from any endpoint');
          setPendingTests([]);
          setError('No tests available at this time');
        }

        // Also try to fetch completed test results
        try {
          const resultsResponse = await sanctumRequest('/api/candidate/tests/results');
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            console.log('📊 Completed tests data:', resultsData);
            setCompletedTests(resultsData.data || []);
          }
        } catch (resultsError) {
          console.log('❌ Error fetching completed tests:', resultsError.message);
          setCompletedTests([]);
        }

      } catch (error) {
        console.error('💥 Error fetching tests:', error);
        setError('Failed to load test assignments');
        setPendingTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [sanctumRequest]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (testStarted && !testPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            handleSubmitTest();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, testPaused, timeRemaining]);

  const startTest = async (test) => {
    try {
      console.log('🚀 Starting test:', test);
      
      // Start the test and fetch questions from API using sanctumRequest
      const response = await sanctumRequest(`/api/candidate/tests/${test.id}/start`, {
        method: 'POST'
      });

      console.log('📥 Start test response:', response);

      // Check if response is a Response object (needs JSON parsing)
      let data = response;
      if (response instanceof Response) {
        if (response.ok) {
          data = await response.json();
        } else {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      }

      console.log('📊 Parsed response data:', data);

      if (data.success && data.data) {
        console.log('✅ Test started successfully:', data.data);
        setActiveTest({
          ...test,
          questions: data.data.questions || [],
          time_limit_minutes: data.data.test?.time_limit || test.time_limit || 45,
          total_questions: data.data.test?.total_questions || data.data.questions?.length || 0
        });
        
        // Set timer based on API response time limit
        const timeLimit = data.data.test?.time_limit || test.time_limit || 45;
        setTimeRemaining(timeLimit * 60); // Convert minutes to seconds
        setCurrentQuestion(0);
        setAnswers({});
        setTestStarted(true);
        setTestPaused(false);
      } else {
        console.error('❌ Start test failed - invalid response:', data);
        throw new Error(data.message || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setError('Failed to start test. Please try again.');
      return;
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (activeTest && currentQuestion < activeTest.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('🚫 Submission already in progress, ignoring duplicate call');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!activeTest) {
        throw new Error('No active test to submit');
      }

      console.log('🚀 Submitting test:', activeTest);
      console.log('🎯 Current answers:', answers);

      // Convert answers to the format expected by backend
      // Frontend stores: { questionId: optionIndex }
      // Backend expects: { questionId: optionIndex as string }
      const formattedAnswers = {};
      Object.keys(answers).forEach(questionId => {
        formattedAnswers[questionId] = String(answers[questionId]);
      });

      const submissionData = {
        answers: formattedAnswers,
        auto_submitted: false
      };

      console.log('📤 Formatted submission data:', submissionData);

      // Submit test using sanctumRequest - use assignment ID, not test ID
      const assignmentId = activeTest.id; // This should be the assignment ID (2)
      console.log('🎯 Submitting to assignment ID:', assignmentId);

      const response = await sanctumRequest(`/api/candidate/tests/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Raw submission response:', response);

      // Handle Response object if needed
      let data = response;
      if (response instanceof Response) {
        console.log('🔄 Response is Response object, parsing JSON...');
        if (response.ok) {
          data = await response.json();
        } else {
          const errorText = await response.text();
          console.error('❌ Response not OK:', response.status, errorText);
          throw new Error(`Submission failed: ${response.status} - ${errorText}`);
        }
      }

      console.log('📊 Parsed submission data:', data);

      if (data && data.success) {
        alert(`Test submitted successfully! Your score: ${data.data?.score_percentage || 'Calculating...'}%`);
        console.log('✅ Test submitted successfully:', data);
      } else {
        console.error('❌ Submission failed - invalid response:', data);
        throw new Error(data?.message || 'Failed to submit test');
      }
      
      // Reset test state
      setActiveTest(null);
      setTestStarted(false);
      setCurrentQuestion(0);
      setAnswers({});
      setTimeRemaining(0);
      
      // Refresh tests
      // fetchTests();
    } catch (error) {
      console.error('❌ Error submitting test:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Failed to submit test: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeRemaining <= 900) return 'text-orange-600'; // Last 15 minutes
    return 'text-green-600';
  };

  const isTestExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
  };

  const getProgressPercentage = () => {
    if (!activeTest) return 0;
    return Math.round(((currentQuestion + 1) / activeTest.questions.length) * 100);
  };

  // Test Taking Interface
  if (activeTest && testStarted) {
    const currentQ = activeTest.questions[currentQuestion];
    const progress = getProgressPercentage();

    return (
      <div className={`min-h-screen ${currentTheme.bgSecondary}`}>
        {/* Test Header */}
        <div className={`${currentTheme.cardBg} border-b ${currentTheme.border} p-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                {activeTest.title}
              </h1>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Question {currentQuestion + 1} of {activeTest.questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${currentTheme.border}`}>
                <Clock className={`w-5 h-5 ${getTimeColor()}`} />
                <span className={`font-mono text-lg font-bold ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              {/* Pause/Resume */}
              <button
                onClick={() => setTestPaused(!testPaused)}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.textSecondary} hover:bg-gray-50`}
              >
                {testPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Test Content */}
        <div className="flex-1 p-6">
          {testPaused ? (
            <div className="text-center py-12">
              <Pause className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className={`text-xl font-medium ${currentTheme.textPrimary} mb-2`}>
                Test Paused
              </h3>
              <p className={`${currentTheme.textSecondary} mb-4`}>
                Click the play button to resume your test
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className={`${currentTheme.cardBg} rounded-lg shadow-sm p-8`}>
                {/* Question */}
                <div className="mb-8">
                  <h2 className={`text-xl font-medium ${currentTheme.textPrimary} mb-6`}>
                    {currentQ.question_text || currentQ.question || 'Question text not available'}
                  </h2>
                  
                  {/* Multiple Choice Options */}
                  {(currentQ.question_type === 'multiple_choice' || currentQ.type === 'multiple_choice' || currentQ.options) && (
                    <div className="space-y-3">
                      {currentQ.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${currentTheme.border} hover:bg-blue-50 ${
                            answers[currentQ.id] === index ? 'bg-blue-100 border-blue-500' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            value={index}
                            checked={answers[currentQ.id] === index}
                            onChange={() => handleAnswerChange(currentQ.id, index)}
                            className="mr-3 text-blue-600"
                          />
                          <span className={currentTheme.textPrimary}>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={previousQuestion}
                    disabled={currentQuestion === 0}
                    className={`flex items-center px-4 py-2 rounded-lg border ${currentTheme.border} ${
                      currentQuestion === 0 ? 'text-gray-400 cursor-not-allowed' : currentTheme.textSecondary + ' hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>

                  <div className="flex space-x-3">
                    {currentQuestion === activeTest.questions.length - 1 ? (
                      <button
                        onClick={handleSubmitTest}
                        disabled={isSubmitting}
                        className={`flex items-center px-6 py-2 text-white rounded-lg ${
                          isSubmitting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                      </button>
                    ) : (
                      <button
                        onClick={nextQuestion}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Navigation */}
              <div className={`${currentTheme.cardBg} rounded-lg shadow-sm p-6 mt-6`}>
                <h3 className={`text-lg font-medium ${currentTheme.textPrimary} mb-4`}>
                  Question Navigation
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {activeTest.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        index === currentQuestion
                          ? 'bg-blue-600 text-white'
                          : answers[activeTest.questions[index].id] !== undefined
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Test Center Interface
  return (
    <div className={`min-h-screen ${currentTheme.bgSecondary}`}>
      {/* Header */}
      <div className={`${currentTheme.cardBg} border-b ${currentTheme.border} p-6`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
              Test Center
            </h1>
            <p className={`${currentTheme.textSecondary}`}>
              Complete your aptitude tests and view results
            </p>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-lg ${currentTheme.border} ${currentTheme.textSecondary} hover:bg-gray-50`}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${currentTheme.cardBg} border-b ${currentTheme.border} px-6`}>
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Tests ({pendingTests.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed Tests ({completedTests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${currentTheme.textSecondary}`}>Loading tests...</p>
          </div>
        ) : (
          <>
            {/* Pending Tests */}
            {activeTab === 'pending' && (
              <div className="space-y-6">
                {pendingTests.length > 0 ? (
                  pendingTests.map(test => (
                    <div key={test.id} className={`${currentTheme.cardBg} border rounded-lg ${currentTheme.border} p-6`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-2`}>
                            {test.title}
                          </h3>
                          <p className={`text-sm ${currentTheme.textSecondary} mb-4`}>{test.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-500">Company</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>{test.company || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Type</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>{test.type || 'Assessment'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Duration</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>{test.timeLimit || 60} minutes</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Questions</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>{test.questions || 10}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Expires</div>
                              <div className={`font-medium ${test.isExpired ? 'text-red-600' : currentTheme.textPrimary}`}>
                                {test.deadline}
                              </div>
                            </div>
                          </div>
                          {test.assignedAt && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-500">Assigned Date</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>
                                {new Date(test.assignedAt).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                          {test.sentAt && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-500">Sent Date</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>
                                {new Date(test.sentAt).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6">
                          {test.isExpired ? (
                            <div className="flex items-center bg-red-100 text-red-800 px-3 py-2 rounded-lg">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Expired
                            </div>
                          ) : (test.status === 'pending' || test.status === 'test_sent' || test.status?.includes('test')) ? (
                            <button
                              onClick={() => startTest(test)}
                              className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Test
                            </button>
                          ) : test.status === 'in_progress' ? (
                            <button
                              onClick={() => startTest(test)}
                              className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Continue Test
                            </button>
                          ) : (
                            <div className="flex items-center bg-gray-100 text-gray-600 px-3 py-2 rounded-lg">
                              <Clock className="w-4 h-4 mr-2" />
                              {test.status || 'Pending'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className={`text-lg font-medium ${currentTheme.textPrimary} mb-2`}>
                      No pending tests
                    </h3>
                    <p className={`${currentTheme.textSecondary}`}>
                      You have no pending test invitations at the moment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Completed Tests */}
            {activeTab === 'completed' && (
              <div className="space-y-6">
                {completedTests.length > 0 ? (
                  completedTests.map(test => (
                    <div key={test.id} className={`${currentTheme.cardBg} border rounded-lg ${currentTheme.border} p-6`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-2`}>
                            {test.title}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-500">Company</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>{test.company}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Position</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>{test.position}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Score</div>
                              <div className={`font-bold text-lg ${test.score >= test.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                                {test.score}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Result</div>
                              <div className={`flex items-center ${test.result === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                                {test.result === 'passed' ? (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                )}
                                {test.result === 'passed' ? 'Passed' : 'Failed'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Completed</div>
                              <div className={`font-medium ${currentTheme.textPrimary}`}>
                                {new Date(test.completedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {test.feedback && (
                            <div className={`p-4 bg-gray-50 rounded-lg`}>
                              <h4 className="font-medium text-gray-900 mb-2">Feedback:</h4>
                              <p className="text-gray-700 text-sm">{test.feedback}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6">
                          <button className={`flex items-center px-4 py-2 border rounded-lg ${currentTheme.border} ${currentTheme.textSecondary} hover:bg-gray-50`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className={`text-lg font-medium ${currentTheme.textPrimary} mb-2`}>
                      No completed tests
                    </h3>
                    <p className={`${currentTheme.textSecondary}`}>
                      Complete your pending tests to see results here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TestCenter;
