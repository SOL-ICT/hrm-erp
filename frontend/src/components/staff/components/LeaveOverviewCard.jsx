import React, { useState, useEffect } from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { Eye, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '@/services/api';

const statusColorMap = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusIconMap = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
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
  const [balanceInfo, setBalanceInfo] = useState({ total: 0, used: 0, available: 0 });

  const chartData = [
    { label: 'Pending', value: leaves.filter(l => l.status === 'pending').length, color: '#FBBF24' },
    { label: 'Approved', value: leaves.filter(l => l.status === 'approved').length, color: '#10B981' },
    { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        // Fetch leave applications
        const leaveData = await apiService.makeRequest('/staff/leave-applications');
        const leaves = leaveData?.data || leaveData || [];
        setLeaves(leaves);
        
        // Calculate balance info
        const currentYear = new Date().getFullYear();
        const currentYearLeaves = leaves.filter(leave => 
          new Date(leave.start_date).getFullYear() === currentYear
        );
        
        const approvedLeaves = currentYearLeaves.filter(l => l.status === 'approved');
        const usedDays = approvedLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
        
        // Fetch entitlements to get total entitled days
        const entitlementsData = await apiService.makeRequest('/staff/entitlements-with-balance');
        const entitlements = entitlementsData?.data || [];
        const totalEntitled = entitlements.reduce((sum, ent) => sum + (ent.entitled_days || 0), 0);
        
        setBalanceInfo({
          total: totalEntitled || 20,
          used: usedDays,
          available: (totalEntitled || 20) - usedDays
        });
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
      
      {/* Balance Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
          <div className="text-xs text-blue-600 font-semibold">Total Entitled</div>
          <div className="text-lg font-bold text-blue-900">{Math.floor(balanceInfo.total)} days</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
          <div className="text-xs text-red-600 font-semibold">Used</div>
          <div className="text-lg font-bold text-red-900">{Math.floor(balanceInfo.used)} days</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <div className="text-xs text-green-600 font-semibold">Available</div>
          <div className="text-lg font-bold text-green-900">{Math.floor(balanceInfo.available)} days</div>
        </div>
      </div>

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
          <div className="text-center py-8">
            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No leave data</p>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      {chartData.length > 0 && (
        <div className="flex justify-center gap-3 mb-4 text-xs">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-gray-600">{item.label} ({item.value})</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Leaves */}
      <div className="mt-4 border-t pt-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">Recent Applications</h5>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : leaves.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No leave applications yet.</p>
          ) : (
            leaves
              .slice(0, 5) // show the top 5
              .map((leave) => {
                const StatusIcon = statusIconMap[leave.status] || Clock;
                const typeName = leave.leave_type?.name || leave.leave_type_name || 'Leave';
                
                return (
                  <div key={leave.id} className="flex justify-between items-start text-sm border-l-4 border-gray-200 pl-3 py-2 hover:bg-gray-50 rounded transition">
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium">{typeName}</div>
                      <div className="text-gray-500 text-xs">{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</div>
                      <div className="text-gray-600 text-xs mt-1">{leave.days} day{leave.days !== 1 ? 's' : ''}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap ${statusColorMap[leave.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {leave.status}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
