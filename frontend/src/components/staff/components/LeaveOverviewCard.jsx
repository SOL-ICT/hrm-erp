import React, { useState, useEffect } from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { Eye } from 'lucide-react';
import apiService from '@/services/api';

const statusColorMap = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getFullYear()}`;
};

export default function LeaveOverviewCard() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const chartData = [
    { label: 'Pending', value: leaves.filter(l => l.status === 'pending').length, color: '#FBBF24' },
    { label: 'Approved', value: leaves.filter(l => l.status === 'approved').length, color: '#10B981' },
    { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const data = await apiService.makeRequest('/staff/leave-applications');
        setLeaves(data || []);
      } catch (err) {
        console.error('Error fetching leave data', err);
        setLeaves([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Leave Overview</h4>
      
      {/* Chart */}
      <div className="flex justify-center mb-4">
        {chartData.length > 0 ? (
          <div style={{ width: '120px', height: '120px' }}>
            <PieChart
              data={chartData}
              radius={40}
              lineWidth={50}
              label={({ dataEntry }) => `${Math.round(dataEntry.percentage)}%`}
              labelStyle={{
                fontSize: '6px',
                fontFamily: 'sans-serif',
                fill: '#fff',
              }}
              labelPosition={70}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No leave data</p>
        )}
      </div>

      {/* Recent Leaves */}
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Applications</h5>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : leaves.length === 0 ? (
            <p className="text-sm text-gray-500">No recent leaves.</p>
          ) : (
            leaves
              .slice(0, 3) // only show the top 3
              .map((leave) => (
                <div key={leave.id} className="flex justify-between items-center text-sm">
                  <div>
                    <div className="text-gray-800 font-medium">{leave.leave_type_name}</div>
                    <div className="text-gray-500 text-xs">{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${statusColorMap[leave.status]}`}>
                    {leave.status}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
