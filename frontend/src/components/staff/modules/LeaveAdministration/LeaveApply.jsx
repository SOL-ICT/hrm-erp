import React, { useState, useEffect } from 'react';
import { Mail, PhoneCall, Info, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { PieChart } from 'react-minimal-pie-chart';
import CalendarReact from 'react-calendar';
import { useAuth } from '@/contexts/AuthContext';
import 'react-calendar/dist/Calendar.css'; // Import react-calendar styles
import { apiService } from "@/services/api";
import { useSessionAware } from '@/hooks/useSessionAware';

export default function LeaveApply() {
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numberOfDays, setNumberOfDays] = useState('');
  const [publicHolidays, setPublicHolidays] = useState('');
  const [handOverTo, setHandOverTo] = useState('');
  const [handOverEmail, setHandOverEmail] = useState('');
  const [dateError, setDateError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(20);
  const [usedDays, setUsedDays] = useState(0);
  const [showSessionAlert, setShowSessionAlert] = useState(false);
  const [approvalUrls, setApprovalUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Supervisor fields
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [savedSupervisor, setSavedSupervisor] = useState(null);
  
  // Phase 4: Dynamic leave data states
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [eligibilityStatus, setEligibilityStatus] = useState(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  

 
  const [staffList, setStaffList] = useState([]);


  const { user } = useAuth();
  const { makeRequestWithRetry, sessionExpired, handleSessionExpired } = useSessionAware();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
  const fetchUserProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');

      try {
      // Fire-and-forget CSRF token prefetch; don't block profile fetch if it fails
      apiService.makeRequest('/sanctum/csrf-cookie').catch((err) => {
        console.warn('CSRF prefetch failed (ignored):', err?.message || err);
      });

      // Fetch the current user's profile (using session-aware wrapper for better error handling)
      const data = await makeRequestWithRetry('/staff/staff-profiles/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      console.log('[FETCH] Profile data:', data);
      console.log('[FETCH] Profile job_structure_id:', data?.job_structure_id);
      console.log('[FETCH] Profile job_code:', data?.job_code);
      setProfile(data);

    } catch (error) {
      console.error('[FETCH] Error fetching profile:', error);
      if (error?.message?.includes('Session expired')) {
        setShowSessionAlert(true);
        setErrorMessage('Your session has expired. Please log in again.');
      } else if (!errorMessage) {
        setErrorMessage('An error occurred while fetching the profile.');
      }
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchUserProfile();
}, [user?.id, makeRequestWithRetry]); 

  // Fetch saved supervisor information
  useEffect(() => {
    const fetchSupervisor = async () => {
      try {
        const data = await makeRequestWithRetry('/staff/supervisor', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        console.log('[FETCH] Saved supervisor:', data);
        if (data?.data) {
          setSavedSupervisor(data.data);
          setSupervisorName(data.data.supervisor_name || '');
          setSupervisorEmail(data.data.supervisor_email || '');
          setSupervisorPhone(data.data.supervisor_phone || '');
        }
      } catch (error) {
        console.error('[FETCH] Error fetching supervisor:', error);
        // Don't show error if supervisor not found (first time)
      }
    };

    fetchSupervisor();
  }, [makeRequestWithRetry]);

  // Phase 4: Fetch available leave types dynamically from API
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const data = await makeRequestWithRetry('/staff/available-leave-types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        console.log('[FETCH] Available leave types response:', data);
        console.log('[FETCH] Available leave types data array:', data?.data);
        const types = data?.data || [];
        console.log('[FETCH] Extracted types count:', types.length);
        types.forEach((type, idx) => {
          console.log(`[FETCH] Type ${idx}:`, type);
        });
        setAvailableLeaveTypes(types);
      } catch (error) {
        console.error('[FETCH] Error fetching leave types:', error);
        setAvailableLeaveTypes([]);
      }
    };

    fetchLeaveTypes();
  }, [makeRequestWithRetry]);

  // Phase 4: Fetch entitlements with balances
  useEffect(() => {
    const fetchEntitlements = async () => {
      try {
        const data = await makeRequestWithRetry('/staff/entitlements-with-balance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        console.log('[FETCH] Entitlements with balance:', data);
        setEntitlements(data?.data || []);
        
        // Set current balance from first available leave type or use existing
        if (data?.data?.length > 0) {
          const totalEntitled = data.data.reduce((sum, ent) => sum + (ent.entitled_days || 0), 0);
          setCurrentBalance(totalEntitled);
        }
      } catch (error) {
        console.error('[FETCH] Error fetching entitlements:', error);
        setEntitlements([]);
      }
    };

    fetchEntitlements();
  }, [makeRequestWithRetry]);

  // Fetch leave applications
  useEffect(() => {
    const fetchLeaves = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        // Use session-aware request wrapper for better error handling on 401
        const data = await makeRequestWithRetry('/staff/leave-applications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        console.log('Fetched leave data:', data);
        
        // Extract data array from response wrapper
        const leaveData = data?.data || data || [];
        
        // Filter current year leaves
        const currentYearLeaves = leaveData.filter(leave => 
          new Date(leave.start_date).getFullYear() === currentYear
        );
        
        setLeaves(leaveData);
        
        // Calculate used days for current year
        const totalUsedDays = currentYearLeaves.reduce((acc, leave) => acc + (leave.days || 0), 0);
        setUsedDays(totalUsedDays);
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
        if (error?.message?.includes('Session expired')) {
          setShowSessionAlert(true);
          setErrorMessage('Your session has expired. Please log in again.');
        } else if (!errorMessage) {
          setErrorMessage('An error occurred while fetching leaves.');
        }
        setLeaves([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaves();
  }, [makeRequestWithRetry]);


  //dynamic staff list fetch
  useEffect(() => {
  const fetchStaffList = async () => {
    try {
      const data = await makeRequestWithRetry('/staff/leave-handover-list', {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      console.log('Fetched staff list:', data);
      // Extract data array from response wrapper
      setStaffList(data?.data || []);
    } catch (err) {
      console.error('[FETCH] Error fetching staff list:', err);
      setStaffList([]);
    }
  };

  fetchStaffList();
}, [makeRequestWithRetry]);
 // Update hand over email when staff selection changes
useEffect(() => {
  if (handOverTo && staffList.length > 0) {
    const selectedStaff = staffList.find(staff => String(staff.id) === String(handOverTo));
    console.log('[HANDOVER] Selected staff:', selectedStaff);
    if (selectedStaff) {
      setHandOverEmail(selectedStaff.email || '');
      console.log('[HANDOVER] Set email to:', selectedStaff.email);
    } else {
      setHandOverEmail('');
      console.log('[HANDOVER] Staff not found, clearing email');
    }
  } else {
    setHandOverEmail('');
  }
}, [handOverTo, staffList]);



  // Calculate end date based on start date, number of days, and public holidays
  const calculateEndDate = (startDateStr, days, holidays) => {
    if (!startDateStr || !days) return '';
    
    const start = new Date(startDateStr);
    let currentDate = new Date(start);
    let workingDaysCount = 0;
    let holidaysSkipped = 0;
    const requiredWorkingDays = parseInt(days);
    const requiredHolidays = parseInt(holidays || 0);

    // Keep going until we have enough working days AND skip the required holidays
    while (workingDaysCount < requiredWorkingDays || holidaysSkipped < requiredHolidays) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
      
      if (isWeekend) {
        // Skip weekends but don't count them
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (holidaysSkipped < requiredHolidays) {
        // Count holidays as extra days (they extend the period)
        holidaysSkipped++;
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        // Count working days
        workingDaysCount++;
        if (workingDaysCount < requiredWorkingDays) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return currentDate.toISOString().split('T')[0];
  };
 // Update current balance when profile changes
  useEffect(() => {
  if (profile?.leave_entitlement != null) {
    setCurrentBalance(profile.leave_entitlement);
  }
}, [profile]);


  // Auto-calculate end date when start date, number of days, or public holidays change
  useEffect(() => {
    if (startDate && numberOfDays) {
      const calculatedEndDate = calculateEndDate(startDate, numberOfDays, publicHolidays);
      setEndDate(calculatedEndDate);
    }
  }, [startDate, numberOfDays, publicHolidays]);

  // Phase 4: Check leave eligibility when dates and leave type are selected
  useEffect(() => {
    const checkEligibility = async () => {
      if (!leaveType || !startDate || !endDate) {
        setEligibilityStatus(null);
        return;
      }

      setIsCheckingEligibility(true);
      try {
        const response = await makeRequestWithRetry('/staff/check-leave-eligibility', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            leave_type_id: parseInt(leaveType),
            start_date: startDate,
            end_date: endDate,
          }),
          credentials: 'include',
        });

        console.log('[CHECK] Eligibility response:', response);
        setEligibilityStatus(response);
        
        if (response?.eligible === false) {
          setDateError(response?.reason || 'Not eligible for this leave');
        } else if (response?.data?.can_proceed === false) {
          setDateError('Insufficient balance for requested dates');
        } else {
          setDateError('');
        }
      } catch (error) {
        console.error('[CHECK] Error checking eligibility:', error);
        setEligibilityStatus(null);
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    const timer = setTimeout(checkEligibility, 500); // Debounce
    return () => clearTimeout(timer);
  }, [leaveType, startDate, endDate, makeRequestWithRetry]);

  // Validate dates and balance
  const validateApplication = () => {
    if (!startDate) {
      setDateError('Start date is required');
      return false;
    }
    
    if (startDate < today) {
      setDateError('Cannot apply for leave on past dates');
      return false;
    }

    if (!numberOfDays || parseInt(numberOfDays) <= 0) {
      setDateError('Number of days must be greater than 0');
      return false;
    }

    // Check balance
    const pendingDays = applications.reduce((acc, app) => acc + parseInt(app.numberOfDays), 0);
    const availableBalance = currentBalance - usedDays - pendingDays;
    
    if (parseInt(numberOfDays) > availableBalance) {
      setDateError(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${numberOfDays} days`);
      return false;
    }
    
    setDateError('');
    return true;
  };

  const resetCurrentForm = () => {
    setLeaveType('');
    setReason('');
    setStartDate('');
    setEndDate('');
    setNumberOfDays('');
    setPublicHolidays('');
    setHandOverTo('');
    setHandOverEmail('');
    setDateError('');
    setErrorMessage('');
  };

  const addToApplicationList = () => {
    if (!validateApplication() || !leaveType || !reason || !handOverTo) {
      setErrorMessage('Please fill in all required fields and ensure valid dates');
      return;
    }

    const newApplication = {
      id: Date.now(),
      leaveType,
      leaveTypeName: availableLeaveTypes.find(type => type.id === parseInt(leaveType))?.name || '',
      reason,
      startDate,
      endDate,
      numberOfDays,
      publicHolidays: publicHolidays || '0',
      handOverTo,
      handOverToName: staffList.find(staff => staff.id === handOverTo)?.first_name + ' ' + staffList.find(staff => staff.id === handOverTo)?.last_name || '',
      handOverEmail
    };

    setApplications([...applications, newApplication]);
    resetCurrentForm();
    setErrorMessage('');
  };

  const removeFromApplicationList = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  const submitAllApplications = async () => {
    if (applications.length === 0) {
      setErrorMessage('No applications to submit');
      return;
    }

    // Validate supervisor information
    if (!supervisorName || !supervisorEmail || !supervisorPhone) {
      setErrorMessage('Please fill in all supervisor information fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = applications.map(app => 
        makeRequestWithRetry('/staff/leave-applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            leave_type_id: app.leaveType,
            reason: app.reason,
            start_date: app.startDate,
            end_date: app.endDate,
            public_holidays: parseInt(app.publicHolidays || 0),
            handover_staff_id: parseInt(app.handOverTo || 0) || null,
            supervisor_name: supervisorName,
            supervisor_email: supervisorEmail,
            supervisor_phone: supervisorPhone,
          }),
        })
      );

      // makeRequestWithRetry throws on non-OK responses; if Promise.all resolves, all succeeded
      const responses = await Promise.all(promises);

      // Extract approval URLs from responses
      const urls = responses
        .filter(res => res?.approval_url)
        .map(res => res.approval_url);
      
      setApprovalUrls(urls);
      setShowSuccess(true);
      setApplications([]);
      setErrorMessage('');
    } catch (error) {
      if (error?.message?.includes('Session expired')) {
        setShowSessionAlert(true);
        setErrorMessage('Your session has expired. Please log in again.');
      } else {
        setErrorMessage('An error occurred while submitting applications. Please try again.');
      }
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate current balance info
  const pendingDays = applications.reduce((acc, app) => acc + parseInt(app.numberOfDays), 0);
  const availableBalance = currentBalance - usedDays - pendingDays;

  // Compute chart data based on leave types
  const chartColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#58D68D'];
  const currentYearLeaves = leaves.filter(leave => 
    new Date(leave.start_date).getFullYear() === currentYear
  );
  
  const typeCounts = currentYearLeaves.reduce((acc, leave) => {
    // Handle both snake_case and direct relationship access
    const typeName = leave.leave_type?.name || leave.leave_type_name || 'Other';
    acc[typeName] = {
      count: (acc[typeName]?.count || 0) + 1,
      days: (acc[typeName]?.days || 0) + (leave.days || 0)
    };
    return acc;
  }, {});

  const chartData = Object.entries(typeCounts)
    .map(([label, data], index) => ({
      label,
      value: data.count,
      color: chartColors[index % chartColors.length],
      days: data.days
    }))
    .filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
            {/* Spinner */}
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitting Applications</h3>
            <p className="text-sm text-gray-600 text-center">Please wait while we process your leave applications...</p>
          </div>
        </div>
      )}

      {/* Session Expired Alert */}
      {showSessionAlert && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Session Expired</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your session has timed out. Please log in again to continue with your leave applications.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowSessionAlert(false);
                  setErrorMessage('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Dismiss
              </button>
              <button
                onClick={handleSessionExpired}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Log In Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Submitted Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4">
              All leave applications have been submitted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setApprovalUrls([]);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="mb-4 xl:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">Apply Leaves</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="E-mail"
          >
            <Mail className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Contact"
          >
            <PhoneCall className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Calendar & Leaves Overview (1/3 width) */}
        <div className="xl:col-span-1 space-y-6">
          {/* CALENDAR */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="text-center text-gray-600 text-sm font-semibold">
                Calendar View
              </div>
              <div className="mt-5 text-center text-xs text-gray-500">
                <CalendarReact />
              </div>
            </div>
            
            {/* Application List */}
            {applications.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h5 className="font-semibold text-gray-900 mb-3">Pending Applications ({applications.length})</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div>
                        <div className="font-medium">{app.leaveTypeName}</div>
                        <div className="text-gray-600">{app.startDate} - {app.endDate} ({app.numberOfDays} days)</div>
                      </div>
                      <button
                        onClick={() => removeFromApplicationList(app.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={submitAllApplications}
                  disabled={isSubmitting}
                  className="w-full mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit All Applications'}
                </button>
              </div>
            )}
          </div>

          {/* LEAVES OVERVIEW */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Leaves Overview ({currentYear})</h4>
            </div>
            
            <div className="p-6">
              <div className="h-64 flex items-center justify-center mb-6">
                {isLoading ? (
                  <p className="text-gray-500 text-sm">Loading chart...</p>
                ) : chartData.length > 0 ? (
                  <div style={{ width: '200px', height: '200px' }}>
                    <PieChart
                      data={chartData}
                      radius={40}
                      lineWidth={50}
                      label={({ dataEntry }) => `${Math.round(dataEntry.percentage)}%`}
                      labelStyle={{
                        fontSize: '8px',
                        fontFamily: 'sans-serif',
                        fill: '#fff',
                      }}
                      labelPosition={70}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No leave applications found for {currentYear}.</p>
                )}
              </div>

              {/* Legend and Numerical Breakdown */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-900 border-b pb-2">
                  Leave Applications This Year:
                </div>
                {chartData.length > 0 ? (
                  <div className="space-y-2">
                    {chartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded transition">
                        <div className="flex items-center flex-1">
                          <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }}
                          ></span>
                          <span className="text-gray-700 font-medium flex-1">{item.label}</span>
                        </div>
                        <div className="text-gray-900 font-semibold text-right min-w-max ml-2">
                          <div className="text-xs text-gray-600">{item.value} app{item.value !== 1 ? 's' : ''}</div>
                          <div className="text-sm">{item.days} day{item.days !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total Applications:</span>
                        <span className="text-blue-600">{chartData.reduce((sum, item) => sum + item.value, 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total Days Used:</span>
                        <span className="text-red-600">{usedDays} days</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Remaining Balance:</span>
                        <span className="text-green-600">{currentBalance - usedDays} days</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No leave applications this year yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Leave Application Form (2/3 width) */}
        <div className="xl:col-span-2">
        {/* APPLY LEAVES FORM */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Apply Leaves</h4>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Leave Category Level - Show Job Structure Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Category Level
              </label>
              <input
                type="text"
                value={profile?.job_code || profile?.data?.job_code || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Supervisor Name - Read-only field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor
                </label>
                <input
                  type="text"
                  value={profile?.supervisor_name || 'Not assigned'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Supervisor name"
                />
              </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Number of Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days *
              </label>
              <input
                type="number"
                min="1"
                value={numberOfDays}
                onChange={(e) => setNumberOfDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Public Holidays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Holidays
              </label>
              <input
                type="number"
                min="0"
                value={publicHolidays}
                onChange={(e) => setPublicHolidays(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Leave Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <div className="relative">
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900"
                  disabled={availableLeaveTypes.length === 0}
                >
                  <option value="">{availableLeaveTypes.length === 0 ? 'Loading...' : 'Select'}</option>
                  {availableLeaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.entitled_days} days)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Hand Over To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hand Over To *
              </label>
              <div className="relative">
                <select
                  value={handOverTo}
                  onChange={(e) => setHandOverTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} - {staff.job_title}
                    </option>
                  ))}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={handOverEmail}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Email will auto-populate"
              />
            </div>

            {/* Supervisor Information Section */}
            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Supervisor Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Supervisor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor/HOD Name *
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter supervisor name"
                    required
                  />
                </div>

                {/* Supervisor Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor Email *
                  </label>
                  <input
                    type="email"
                    value={supervisorEmail}
                    onChange={(e) => setSupervisorEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="supervisor@example.com"
                    required
                  />
                </div>

                {/* Supervisor Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor Phone *
                  </label>
                  <input
                    type="tel"
                    value={supervisorPhone}
                    onChange={(e) => setSupervisorPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="+234 XXX XXX XXXX"
                    required
                  />
                </div>
              </div>
              {savedSupervisor && (
                <p className="mt-2 text-xs text-gray-500">
                  💡 These details will be saved for future leave applications
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {dateError && (
              <p className="text-sm text-red-600">{dateError}</p>
            )}
          </div>

          {/* Card Footer */}
          <div className="p-6 border-t border-gray-200">
            {/* Phase 4: Eligibility Status Alert */}
            {isCheckingEligibility && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                Checking eligibility...
              </div>
            )}
            
            {eligibilityStatus && !isCheckingEligibility && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                eligibilityStatus.eligible 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="font-medium">{eligibilityStatus.reason}</div>
                {eligibilityStatus.data?.requested_days && (
                  <div className="mt-1 text-xs">
                    Requested: {eligibilityStatus.data.requested_days} days | Available: {eligibilityStatus.data.available_balance} days
                  </div>
                )}
              </div>
            )}

            {dateError && !eligibilityStatus && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {dateError}
              </div>
            )}
            
            <div className="mb-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span className="font-medium">{currentBalance} days</span>
              </div>
              <div className="flex justify-between">
                <span>Used This Year:</span>
                <span className="font-medium">{usedDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Applications:</span>
                <span className="font-medium">{pendingDays} days</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>Available Balance:</span>
                <span className={`font-bold ${availableBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {availableBalance} days
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={resetCurrentForm}
              >
                Clear
              </button>
              <button 
                className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={addToApplicationList}
                disabled={!leaveType || !reason || !handOverTo || !numberOfDays || !startDate || dateError || isSubmitting}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to List
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>
        {/* End Right Column */}

      </div>
    </div>
  );
}