import React, { useState, useEffect } from 'react';
import { Mail, PhoneCall, Info, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { PieChart } from 'react-minimal-pie-chart';
import CalendarReact from 'react-calendar';
import { useAuth } from '@/contexts/AuthContext';
import 'react-calendar/dist/Calendar.css'; // Import react-calendar styles
import { apiService } from "@/services/api";

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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  

 
  const [staffList, setStaffList] = useState([]);


  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
  const fetchUserProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Get CSRF token
      await apiService.makeRequest('/sanctum/csrf-cookie', {
        credentials: 'include',
      });

      // Fetch the current user's profile (apiService returns parsed JSON)
      const data = await apiService.makeRequest('/staff/staff-profiles/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      console.log('[FETCH] Profile data:', data);
      setProfile(data);

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
}, [user?.id]); 

  // Fetch leave applications
  useEffect(() => {
    const fetchLeaves = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        // apiService returns parsed JSON or throws on errors
        const data = await apiService.makeRequest('/staff/leave-applications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        console.log('Fetched leave data:', data);
        // Filter current year leaves
        const currentYearLeaves = data.filter(leave => 
          new Date(leave.start_date).getFullYear() === currentYear
        );
        
        setLeaves(data || []);
        
        // Calculate used days for current year
        const totalUsedDays = currentYearLeaves.reduce((acc, leave) => acc + (leave.days || 0), 0);
        setUsedDays(totalUsedDays);
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
        if (!errorMessage) setErrorMessage('An error occurred while fetching leaves.');
        setLeaves([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaves();
  }, []);


  //dynamic staff list fetch
  useEffect(() => {
  const fetchStaffList = async () => {
    try {
      const data = await apiService.makeRequest('/staff/leave-handover-list', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      console.log('Fetched staff list:', data);
      setStaffList(data || []);
    } catch (err) {
      console.error('[FETCH] Error fetching staff list:', err);
      setStaffList([]);
    }
  };

  fetchStaffList();
}, []);
 // Update hand over email when staff selection changes
useEffect(() => {
  if (handOverTo && staffList.length > 0) {
    const selectedStaff = staffList.find(staff => staff.id === handOverTo);
    if (selectedStaff) {
      setHandOverEmail(selectedStaff.email || '');
    } else {
      setHandOverEmail('');
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
    let addedDays = 0;
    const totalDaysToAdd = parseInt(days) + parseInt(holidays || 0) - 1;

    while (addedDays < totalDaysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        addedDays++;
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
      leaveTypeName: leaveTypes.find(type => type.value === leaveType)?.label || '',
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

    try {
      const promises = applications.map(app => 
        apiService.makeRequest('/staff/leave-applications', {
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
            days: parseInt(app.numberOfDays),
          }),
        })
      );

      // apiService throws on non-OK responses; if Promise.all resolves, all succeeded
      const responses = await Promise.all(promises);

      setShowSuccess(true);
      setApplications([]);
      setErrorMessage('');
      setTimeout(() => {
        setShowSuccess(false);
        // Refresh leave data
        window.location.reload();
      }, 2000);
    } catch (error) {
      setErrorMessage('An error occurred while submitting applications. Please try again.');
      console.error('Submission error:', error);
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
    const typeName = leave.leave_type_name || 'Unknown';
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

  const leaveTypes = [
    { value: '1', label: 'Annual Leave Senior Staff Level' },
    { value: '2', label: 'Compassionate Leave' },
    { value: '3', label: 'Sick Leave' },
    { value: '4', label: 'Maternity Leave' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-green-600">Submitted Successfully!</h3>
            <p className="text-sm text-gray-600 mt-2">All leave applications have been submitted.</p>
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
        
        {/* APPLY LEAVES FORM */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Apply Leaves</h4>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Leave Category Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Category Level
              </label>
              <input
                type="text"
                value={profile?.category_name || ''}
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
                >
                  <option value="">Select</option>
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
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

            {/* Reason */}
            <div>
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
                disabled={!leaveType || !reason || !handOverTo || !numberOfDays || !startDate || dateError}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to List
              </button>
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="text-center text-gray-600 text-sm">
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
                className="w-full mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit All Applications
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
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {item.value} apps ({item.days} days)
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Used:</span>
                      <span className="text-red-600">{usedDays} days</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Remaining Balance:</span>
                      <span className="text-green-600">{currentBalance - usedDays} days</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Apply for leaves to see breakdown here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};