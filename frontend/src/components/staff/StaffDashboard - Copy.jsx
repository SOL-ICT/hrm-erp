import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  Info, 
  FileText, 
  Box, 
  Briefcase, 
  Award,
  Plus,
  MoreVertical,
  Eye,
  PlusCircle,
  Trash2,
  Download,
  Settings,
  X,
  ChevronDown
} from 'lucide-react';

export default function StaffDashboard() {
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('single');
  const [selectedDays, setSelectedDays] = useState(2);

  // Username 
  const { user } = useAuth();

  // Sample data
  const statsCards = [
    { title: 'Completed Projects', value: 51, color: 'success', icon: FileText, bgColor: 'bg-green-100' },
    { title: 'Total Attendance', value: 162, color: 'primary', icon: Box, bgColor: 'bg-blue-100' },
    { title: 'Absent', value: 12, color: 'secondary', icon: Briefcase, bgColor: 'bg-gray-100' },
    { title: 'Awards', value: 0, color: 'danger', icon: Award, bgColor: 'bg-red-100' }
  ];

  const recentActivities = [
    { text: 'You Late to day', subtext: 'Your office intime is 9:42', detail: 'Late time 14min', time: 'Just Now', color: 'bg-pink-500' },
    { text: 'Below for those interested', subtext: 'Undoubtable source', time: '1 Hour ago', color: 'bg-yellow-500' },
    { text: 'Success! your Lunch Time', subtext: 'Lunch time 1:30 To 2:30', time: '4 hours ago', color: 'bg-blue-500' },
    { text: 'Many desktops Publishing The', subtext: 'versions are evolved', detail: 'Page editors now use...', time: '5 hours ago', color: 'bg-green-500' },
    { text: 'Below for those interested', subtext: 'Birthday on Feb 16', time: '11 Jan 2020', color: 'bg-orange-500' }
  ];

  const upcomingHolidays = [
    { date: '3', month: 'FEB', title: 'Office Off', desc: 'Sunday', daysLeft: '3 days to left', color: 'bg-green-100 text-green-700' },
    { date: '10', month: 'FEB', title: 'Public Holiday', desc: 'Enjoy your day off', daysLeft: '13 days to left', color: 'bg-purple-100 text-purple-700' },
    { date: '20', month: 'MAR', title: 'Office Off', desc: 'Sunday', daysLeft: '23 days to left', color: 'bg-orange-100 text-orange-700' },
    { date: '17', month: 'FEB', title: 'Optional Holiday', desc: 'Sunday', daysLeft: '20 days to left', color: 'bg-yellow-100 text-yellow-700' },
    { date: '13', month: 'MAR', title: 'Conference', desc: 'Money Update', daysLeft: '35 days to left', color: 'bg-pink-100 text-pink-700' }
  ];

  const leaveBalance = [
    { type: 'Vacation', used: 16.5, available: 3.5, allowance: 20, color: 'bg-blue-500' },
    { type: 'Sick Leave', used: 4.5, available: 16, allowance: 20, color: 'bg-orange-500' },
    { type: 'Unpaid leave', used: 5, available: 360, allowance: 365, color: 'bg-yellow-500' },
    { type: 'Work from Home', used: 8, available: 22, allowance: 30, color: 'bg-blue-400' }
  ];

  const jobApplications = [
    { id: 1, title: 'Html Business Template', status: 'Completed', dueDate: '19 Feb 2020', checked: true, statusColor: 'bg-green-100 text-green-800' },
    { id: 2, title: 'Adobe xd Education Template', status: 'Accept', dueDate: '24 Feb 2020', checked: false, statusColor: 'bg-blue-100 text-blue-800' },
    { id: 3, title: 'js recent Plugin Updated', status: 'Accept', dueDate: '5 Mar 2020', checked: false, statusColor: 'bg-blue-100 text-blue-800' },
    { id: 4, title: 'Sass Development Program', status: 'Completed', dueDate: '14 Mar 2020', checked: true, statusColor: 'bg-green-100 text-green-800' },
    { id: 5, title: 'Angular Development', status: 'Accept', dueDate: '20 Mar 2020', checked: false, statusColor: 'bg-blue-100 text-blue-800' }
  ];

  const upcomingBirthdays = [
    { name: 'Jennifer Kerr', date: '19 Feb 2020 26 Years Old', status: 'Today', showWish: true },
    { name: 'Rebecca Cameron', date: '19 Feb 2020 26 Years Old', status: '22 Days To Left', showWish: false },
    { name: 'Jessica Johnston', date: '19 Feb 2020 26 Years Old', status: '22 Days To Left', showWish: false },
    { name: 'Lily Ball', date: '19 Feb 2020 26 Years Old', status: '22 Days To Left', showWish: false },
    { name: 'Yadira Acklin', date: '19 Feb 2020 26 Years Old', status: '22 Days To Left', showWish: false }
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6">
        <div className="mb-4 xl:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome, <span className="font-normal text-gray-700">{user?.name || "Loading..."}</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* <button 
            onClick={() => setIsApplyLeaveModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Apply Leaves
          </button> */}
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-gray-200 rounded-md">
              <div className="px-3 py-2 bg-gray-50 border-r">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <input type="text" placeholder="19 Feb 2020" className="px-3 py-2 rounded-r-md focus:outline-none" />
            </div>
            
            <div className="flex items-center border border-gray-200 rounded-md">
              <div className="px-3 py-2 bg-gray-50 border-r">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <input type="text" placeholder="09:30am" className="px-3 py-2 rounded-r-md focus:outline-none" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsClockInModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Clock In
            </button>
            <button className="bg-gray-100 p-2 rounded-md hover:bg-gray-200">
              <Mail className="w-4 h-4 text-gray-700" />
            </button>
            <button className="bg-gray-100 p-2 rounded-md hover:bg-gray-200">
              <Phone className="w-4 h-4 text-gray-700" />
            </button>
            <button className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-gray-700 text-sm mb-2">{card.title}</h5>
                <h3 className={`text-2xl font-bold text-${card.color === 'success' ? 'green' : card.color === 'primary' ? 'blue' : card.color === 'secondary' ? 'gray' : 'red'}-700`}>
                  {card.value}
                </h3>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`w-6 h-6 text-${card.color === 'success' ? 'green' : card.color === 'primary' ? 'blue' : card.color === 'secondary' ? 'gray' : 'red'}-700`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Chart Placeholder */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Salary And Attendance chart</h4>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                  <span className="text-sm text-gray-700">Attendance</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span className="text-sm text-gray-700">Salary</span>
                </div>
                <div className="relative">
                  <button className="flex items-center bg-gray-100 px-3 py-1 rounded text-sm text-gray-700">
                    Year <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <span className="text-gray-600">Chart Placeholder</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                  <span className={`w-3 h-3 ${activity.color} rounded-full mt-2 flex-shrink-0`}></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.text}</p>
                    <p className="text-sm text-gray-700">{activity.subtext}</p>
                    {activity.detail && <p className="text-sm text-gray-700">{activity.detail}</p>}
                  </div>
                  <span className="text-sm text-gray-600">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar, Holidays, and Leave Balance Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        {/* Calendar */}
        <div className="xl:col-span-3 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Calendar</h4>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <span className="text-gray-600">Calendar Placeholder</span>
            </div>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="xl:col-span-4 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Up Coming Holidays</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingHolidays.map((holiday, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${holiday.color} rounded-lg p-2 text-center min-w-16`}>
                      <div className="text-lg font-bold">{holiday.date}</div>
                      <div className="text-xs">{holiday.month}</div>
                    </div>
                    <div>
                      <h6 className="font-semibold text-gray-900">{holiday.title}</h6>
                      <p className="text-sm text-gray-700">{holiday.desc}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{holiday.daysLeft}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="xl:col-span-5 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Leave Balance</h4>
            <button 
            onClick={() => setIsApplyLeaveModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Apply for Leaves
          </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-700">Balance</th>
                    <th className="text-left py-2 text-gray-700">Used</th>
                    <th className="text-center py-2 text-gray-700">Available</th>
                    <th className="text-center py-2 text-gray-700">Allowance</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveBalance.map((leave, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 flex items-center">
                        <span className={`w-3 h-3 ${leave.color} rounded-full mr-3`}></span>
                        <span className="font-medium text-gray-900">{leave.type}</span>
                      </td>
                      <td className="py-3 font-medium text-gray-900">{leave.used}</td>
                      <td className="py-3 text-center text-gray-700">{leave.available}</td>
                      <td className="py-3 text-center text-gray-700">{leave.allowance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 border-t border-gray-200 mt-4">
              <div className="text-center py-4 border-r border-gray-200">
                <h5 className="font-medium text-gray-900 mb-1">Vacation</h5>
                <span className="text-lg font-semibold text-blue-600">8 <span className="text-gray-500">/</span> 16</span>
              </div>
              <div className="text-center py-4 border-r border-gray-200">
                <h5 className="font-medium text-gray-900 mb-1">Sick leave</h5>
                <span className="text-lg font-semibold text-red-600">4.5 <span className="text-gray-500">/</span> 10</span>
              </div>
              <div className="text-center py-4">
                <h5 className="font-medium text-gray-900 mb-1">Unpaid leave</h5>
                <span className="text-lg font-semibold text-gray-900">5 <span className="text-gray-500">/</span> 365</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Applications and Birthdays Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Job Applications */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Recent Job Application</h4>
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded">
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center">
                New Task <Plus className="w-4 h-4 ml-2" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-700">S.no</th>
                    <th className="text-left py-3 text-gray-700">Project Title</th>
                    <th className="text-left py-3 text-gray-700">Assigned to</th>
                    <th className="text-left py-3 text-gray-700">Due Date</th>
                    <th className="text-left py-3 text-gray-700">Request Status</th>
                    <th className="text-left py-3 text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobApplications.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100">
                      <td className="py-4 text-gray-900">{job.id}</td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-100 rounded mr-3 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-900">{job.title}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex -space-x-2">
                          {[1,2,3,4].map((i) => (
                            <div key={i} className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white"></div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-gray-900">{job.dueDate}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.statusColor}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Mail className="w-4 h-4" />
                        </button>
                        <input type="checkbox" defaultChecked={job.checked} className="rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Up Coming Birthdays</h4>
            <button className="text-blue-600 text-sm hover:text-blue-800">View All</button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingBirthdays.map((person, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded"></div>
                    <div>
                      <h6 className="font-semibold text-gray-900">{person.name}</h6>
                      <p className="text-sm text-gray-700">{person.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${person.showWish ? 'text-green-700' : 'text-gray-600'}`}>
                      {person.status}
                    </span>
                    {person.showWish && (
                      <button className="block mt-1 bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs">
                        🎂 Wish Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clock In Modal */}
      {isClockInModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Clock In
              </h5>
              <button onClick={() => setIsClockInModalOpen(false)}>
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 text-center">
                <div className="text-2xl font-mono border rounded p-4 mb-2 text-gray-900">
                  09:30:45 AM
                </div>
                <label className="text-sm text-gray-700">Current Time</label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                <input type="text" value="225.192.145.1" disabled className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-gray-900" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Working From</label>
                <select className="w-full p-2 border border-gray-200 rounded text-gray-900">
                  <option>Select</option>
                  <option>Office</option>
                  <option>Home</option>
                  <option>Others</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Note:</label>
                <textarea className="w-full p-2 border border-gray-200 rounded text-gray-900" rows="3" defaultValue="Some text here..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setIsClockInModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-gray-700"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Clock In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyLeaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h5 className="text-lg font-semibold text-gray-900">Apply Leaves</h5>
              <button onClick={() => setIsApplyLeaveModalOpen(false)}>
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Dates</label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded text-gray-900"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="single">Single Leaves</option>
                  <option value="multiple">Multiple Leaves</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
                <div className="flex items-center border border-gray-200 rounded">
                  <input type="text" placeholder="select dates" className="flex-1 p-2 rounded-l text-gray-900" />
                  <div className="p-2 bg-gray-50 border-l">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Leaves Types</label>
                <select className="w-full p-2 border border-gray-200 rounded text-gray-900">
                  <option>Select</option>
                  <option>Half Day Leave</option>
                  <option>Casual Leaves</option>
                  <option>Sick Leaves</option>
                  <option>Maternity Leaves</option>
                  <option>Paternity Leaves</option>
                  <option>Annual Leaves</option>
                  <option>Unpaid Leaves</option>
                  <option>Other Leaves</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason:</label>
                <textarea className="w-full p-2 border border-gray-200 rounded text-gray-900" rows="5" defaultValue="Some text here..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">Selected Days:</span>
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">{selectedDays}</span>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsApplyLeaveModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-gray-700"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}