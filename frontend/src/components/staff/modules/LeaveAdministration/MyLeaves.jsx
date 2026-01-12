import React, { useState, useEffect } from 'react';
import { Mail, PhoneCall, Info, Eye, Trash2 } from 'lucide-react';
import { PieChart } from 'react-minimal-pie-chart';
import { apiService } from "@/services/api";
import { useSessionAware } from '@/hooks/useSessionAware';

// Maps status to Tailwind CSS badge colors
const statusColorMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
};

// Date formatter helper function
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export default function MyLeaves() {
    const [isViewLeaveModalOpen, setViewLeaveModalOpen] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [reportSubject, setReportSubject] = useState('');
    const [showSessionAlert, setShowSessionAlert] = useState(false);

    const { makeRequestWithRetry, sessionExpired, handleSessionExpired } = useSessionAware();

    // Compute chart data based on leave statuses
    const chartData = [
        { label: 'Pending', value: leaves.filter(l => l.status === 'pending').length, color: '#FBBF24' },
        { label: 'Approved', value: leaves.filter(l => l.status === 'approved').length, color: '#10B981' },
        { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: '#EF4444' },
    ].filter(item => item.value > 0);

    // Fetch leaves from the Laravel API
    useEffect(() => {
        const fetchLeaves = async () => {
            setIsLoading(true);
            setErrorMessage('');
            try {
                // Use session-aware request wrapper for better 401 handling
                const data = await makeRequestWithRetry('/staff/leave-applications', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    credentials: 'include',
                });

                console.log('Fetched leave data:', data);
                setLeaves(data || []);
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

    const handleViewLeave = (leave) => {
        setSelectedLeave(leave);
        setViewLeaveModalOpen(true);
    };

    const handleDeleteLeave = async (leaveId) => {
        if (!confirm('Are you sure you want to delete this leave application?')) {
            return;
        }

        setDeleting(true);
        setErrorMessage('');
        try {
            // Use session-aware request wrapper for better error handling
            await makeRequestWithRetry(`/staff/leave-applications/${leaveId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            setLeaves(prevLeaves => prevLeaves.filter(leave => leave.id !== leaveId));
            setErrorMessage('');
        } catch (error) {
            console.error('Error deleting leave:', error);
            if (error?.message?.includes('Session expired')) {
                setShowSessionAlert(true);
                setErrorMessage('Your session has expired. Please log in again.');
            } else if (!errorMessage) {
                setErrorMessage('An error occurred while deleting the leave.');
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleReportSubmit = async () => {
        setErrorMessage('');
        try {
            // Use session-aware request wrapper for better error handling
            await makeRequestWithRetry('/staff/report-issue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: 'hr@gmail.com',
                    subject: reportSubject,
                }),
            });

            setReportSubject('');
            setReportModalOpen(false);
        } catch (error) {
            console.error('Error submitting report:', error);
            if (error?.message?.includes('Session expired')) {
                setShowSessionAlert(true);
                setErrorMessage('Your session has expired. Please log in again.');
            } else if (!errorMessage) {
                setErrorMessage('An error occurred while submitting the report.');
            }
        }
    };

    return (
        <>
            {/* Session Expired Alert */}
            {showSessionAlert && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                        <h3 className="text-lg font-semibold text-orange-600 mb-2">Session Expired</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Your session has timed out. Please log in again to continue viewing your leaves.
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

            {/* Error Message */}
            {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {errorMessage}
                </div>
            )}

            {/* PAGE HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">My Leaves</h1>
                </div>
                <div className="mt-4 xl:mt-0 flex items-center space-x-2">
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                        <Mail size={20} />
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                        <PhoneCall size={20} />
                    </button>
                    <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Info size={20} />
                    </button>
                </div>
            </div>
            {/* END PAGE HEADER */}

            {/* ROW */}
            <div className="grid grid-cols-12 gap-6">
                {/* Leaves Summary Table */}
                <div className="col-span-12 xxl:col-span-9">
                    <div className="bg-white shadow-md rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-700">Leaves Summary</h4>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-center">#ID</th>
                                            <th scope="col" className="px-6 py-3">Leave Type</th>
                                            <th scope="col" className="px-6 py-3">From</th>
                                            <th scope="col" className="px-6 py-3">To</th>
                                            <th scope="col" className="px-6 py-3">Days</th>
                                            <th scope="col" className="px-6 py-3">Reason</th>
                                            <th scope="col" className="px-6 py-3">Applied On</th>
                                            <th scope="col" className="px-6 py-3">Status</th>
                                            <th scope="col" className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4">Loading leaves...</td>
                                            </tr>
                                        ) : leaves.length > 0 ? (
                                            leaves.map((leave) => (
                                                <tr key={leave.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-center">{leave.id}</td>
                                                    <td className="px-6 py-4">{leave.leave_type_name || 'Unknown Leave Type'}</td>
                                                    <td className="px-6 py-4">{formatDate(leave.start_date)}</td>
                                                    <td className="px-6 py-4">{leave.end_date ? formatDate(leave.end_date) : 'N/A'}</td>
                                                    <td className="px-6 py-4 font-semibold">{leave.days} Day{leave.days > 1 ? 's' : ''}</td>
                                                    <td className="px-6 py-4 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                                                    <td className="px-6 py-4">{formatDate(leave.applied_at)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[leave.status]}`}>
                                                            {leave.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 flex items-center space-x-3">
                                                        <button 
                                                            onClick={() => handleViewLeave(leave)} 
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {leave.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleDeleteLeave(leave.id)}
                                                                className={`text-red-600 hover:text-red-800 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                title="Delete Application"
                                                                disabled={deleting}
                                                            >
                                                                {deleting ? (
                                                                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <Trash2 size={16} />
                                                                )}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => setReportModalOpen(true)} 
                                                            className="text-gray-500 hover:text-gray-700"
                                                            title="Report Issue"
                                                        >
                                                            <Info size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4">No leave records found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaves Overview Chart */}
                <div className="col-span-12 xxl:col-span-3">
                    <div className="bg-white shadow-md rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-700">Leaves Overview</h4>
                        </div>
                        <div className="p-6">
                            <div className="mx-auto h-48 flex items-center justify-center">
                                {chartData.length > 0 ? (
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
                                    <p className="text-gray-500">No data available for chart</p>
                                )}
                            </div>
                            <div className="pt-7 pb-5 mx-auto text-center">
                                <div className="space-y-3 font-semibold text-gray-600">
                                    <div className="flex items-center justify-center">
                                        <span className="h-3 w-3 rounded-full bg-yellow-400 mr-2"></span>
                                        Pending Leaves
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                                        Approved Leaves
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                                        Rejected Leaves
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* END ROW */}

            {/* MODALS */}

            {/* LEAVE APPLICATION MODAL (VIEW) */}
            {isViewLeaveModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h5 className="text-xl font-semibold">Leave Application Details</h5>
                            <button 
                                onClick={() => setViewLeaveModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6">
                            <table className="w-full">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">Application ID</td>
                                        <td className="py-2 text-gray-800">: {selectedLeave.id}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">Leave Type</td>
                                        <td className="py-2 text-gray-800">: {selectedLeave.leave_type_name || 'Unknown Leave Type'}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">Start Date</td>
                                        <td className="py-2 text-gray-800">: {formatDate(selectedLeave.start_date)}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">End Date</td>
                                        <td className="py-2 text-gray-800">: {selectedLeave.end_date ? formatDate(selectedLeave.end_date) : 'N/A'}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">Days</td>
                                        <td className="py-2 text-gray-800">: {selectedLeave.days} day{selectedLeave.days > 1 ? 's' : ''}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">Reason</td>
                                        <td className="py-2 text-gray-800">: {selectedLeave.reason}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 font-semibold text-gray-600">Status</td>
                                        <td className="py-2">
                                            : <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[selectedLeave.status]}`}>
                                                {selectedLeave.status}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-semibold text-gray-600">Applied On</td>
                                        <td className="py-2 text-gray-800">: {formatDate(selectedLeave.applied_at)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 text-right">
                            <button 
                                onClick={() => setViewLeaveModalOpen(false)} 
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* REPORT MODAL */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h5 className="text-xl font-semibold">Report Issue</h5>
                            <button 
                                onClick={() => setReportModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value="hr@gmail.com" 
                                    className="bg-gray-100 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <textarea 
                                    rows="3" 
                                    placeholder="Describe your issue..."
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={reportSubject}
                                    onChange={(e) => setReportSubject(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end items-center space-x-2">
                            <button 
                                onClick={() => setReportModalOpen(false)} 
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleReportSubmit}
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}