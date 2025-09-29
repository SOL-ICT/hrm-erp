"use client"

import React, { useState, useEffect } from 'react';
import { Mail, PhoneCall, Info, ChevronDown } from 'lucide-react';
import { PieChart } from 'react-minimal-pie-chart';
import CalendarReact from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import react-calendar styles

export default function LeaveApply() {
  const [dateRangeType, setDateRangeType] = useState('single');
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch leave applications for chart
  useEffect(() => {
    const fetchLeaves = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await fetch('http://localhost:8000/api/staff/leave-applications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setErrorMessage('Authentication failed. Please log in again.');
          } else {
            setErrorMessage(`Failed to fetch leaves: HTTP ${response.status}`);
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched leave data:', data); // Debug log
        setLeaves(data);
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

  // Compute chart data based on leave types
  const chartColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#58D68D'];
  const typeCounts = leaves.reduce((acc, leave) => {
    const typeName = leave.leave_type_name || 'Unknown';
    acc[typeName] = (acc[typeName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(typeCounts)
    .map(([label, value], index) => ({
      label,
      value,
      color: chartColors[index % chartColors.length],
    }))
    .filter(item => item.value > 0);

  // Validate dates
  const validateDates = (start, end) => {
    if (!start && !end) {
      setDateError('');
      return;
    }
    
    if (start && start < today) {
      setDateError('Cannot apply for leave on past dates');
      return;
    }
    
    if (end && start && end < start) {
      setDateError('Return date cannot be before start date');
      return;
    }
    
    setDateError('');
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    validateDates(date, endDate);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    validateDates(startDate, date);
  };

  const handleSingleDateChange = (date) => {
    setSingleDate(date);
    if (date && date < today) {
      setDateError('Cannot apply for leave on past dates');
    } else {
      setDateError('');
    }
  };

  const resetForm = () => {
    setDateRangeType('single');
    setLeaveType('');
    setReason('');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
    setDateError('');
    setErrorMessage('');
  };

  const calculateDays = () => {
    if (dateRangeType === 'single' && singleDate) {
      return 1;
    }
    if (dateRangeType === 'multiple' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (dateError) {
      console.log('Submission blocked due to date error:', dateError);
      return;
    }

    const days = calculateDays();
    if (days === 0) {
      setErrorMessage('Please select valid dates');
      return;
    }

    const payload = {
      leave_type_id: leaveType,
      reason,
      start_date: dateRangeType === 'single' ? singleDate : startDate,
      end_date: dateRangeType === 'single' ? singleDate : endDate,
      days,
    };

    try {
      const response = await fetch('http://localhost:8000/api/staff/leave-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Submission failed. Please check your input.');
        console.error('Server responded with error:', errorData);
        return;
      }

      setShowSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 2000);
    } catch (error) {
      setErrorMessage('An error occurred while submitting. Please try again.');
      console.error('Submission error:', error);
    }
  };

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
            <p className="text-sm text-gray-600 mt-2">Your leave application has been submitted.</p>
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
          
          <div className="p-6">
            {/* Leave Dates Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaves Dates
              </label>
              <div className="relative">
                <select
                  value={dateRangeType}
                  onChange={(e) => setDateRangeType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900"
                >
                  <option value="single">Single Leaves</option>
                  <option value="multiple">Multiple Leaves</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Range Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range:
              </label>
              {dateRangeType === 'single' ? (
                <div className="relative">
                  <input
                    type="date"
                    name="singledaterange"
                    value={singleDate}
                    onChange={(e) => handleSingleDateChange(e.target.value)}
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="date"
                      name="startDate"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      min={today}
                      placeholder="Start Date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      name="endDate"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      min={startDate || today}
                      placeholder="End Date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              )}
              {dateError && (
                <p className="mt-2 text-sm text-red-600">{dateError}</p>
              )}
            </div>

            {/* Leave Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaves Types
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

            {/* Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason:
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-900">Selected Days:</span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {calculateDays()}
                </span>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  onClick={resetForm}
                >
                  Close
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleSubmit}
                  disabled={dateError || !leaveType || (!singleDate && dateRangeType === 'single') || (!startDate && !endDate && dateRangeType === 'multiple')}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <CalendarReact className="text-gray-900" />
        </div>

        {/* LEAVES OVERVIEW */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Leaves Overview</h4>
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
                <p className="text-gray-500 text-sm">No leave applications found. Apply for a leave to see data.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};