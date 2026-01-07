import { useState, useEffect } from 'react';
import CalendarReact from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { useAuth } from "@/contexts/AuthContext";
import LeaveOverviewCard from './components/LeaveOverviewCard';
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
import { apiService } from '@/services/api';

export default function StaffDashboard({ setActiveComponent }) {
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [statsCards, setStatsCards] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Username 
  const { user } = useAuth();

  // API functions - replace with actual API calls
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Replace these with actual API endpoints
      // const statsResponse = await apiService.get('/dashboard/stats');
      // const activitiesResponse = await apiService.get('/dashboard/activities');
      // const holidaysResponse = await apiService.get('/dashboard/holidays');
      // const birthdaysResponse = await apiService.get('/dashboard/birthdays');
      
      // setStatsCards(statsResponse.data);
      // setRecentActivities(activitiesResponse.data);
      // setUpcomingHolidays(holidaysResponse.data);
      // setUpcomingBirthdays(birthdaysResponse.data);

      // For now, set empty arrays
      setStatsCards([]);
      setRecentActivities([]);
      setUpcomingHolidays([]);
      setUpcomingBirthdays([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Default stats card structure for when data is available
  const defaultStatsConfig = [
    { title: 'Completed Projects', icon: FileText, bgColor: 'bg-green-100', textColor: 'text-green-700' },
    { title: 'Total Attendance', icon: Box, bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    { title: 'Absent Days', icon: Briefcase, bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    { title: 'Awards', icon: Award, bgColor: 'bg-red-100', textColor: 'text-red-700' }
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
          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-gray-200 rounded-md">
              <div className="px-3 py-2 bg-gray-50 border-r">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <input 
                type="text" 
                value={formatDate(currentTime)}
                readOnly
                className="px-3 py-2 rounded-r-md focus:outline-none bg-white text-gray-900" 
              />
            </div>
            
            <div className="flex items-center border border-gray-200 rounded-md">
              <div className="px-3 py-2 bg-gray-50 border-r">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <input 
                type="text" 
                value={formatTime(currentTime)}
                readOnly
                className="px-3 py-2 rounded-r-md focus:outline-none bg-white text-gray-900" 
              />
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
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="bg-gray-200 p-3 rounded-lg w-12 h-12"></div>
              </div>
            </div>
          ))
        ) : statsCards.length > 0 ? (
          statsCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-gray-700 text-sm mb-2">{card.title}</h5>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {card.value || 0}
                  </h3>
                </div>
                <div className={`${card.bgColor || defaultStatsConfig[index]?.bgColor} p-3 rounded-lg`}>
                  {card.icon ? (
                    <card.icon className={`w-6 h-6 ${card.textColor || defaultStatsConfig[index]?.textColor}`} />
                  ) : (
                    defaultStatsConfig[index] && (() => {
                      const IconComponent = defaultStatsConfig[index].icon;
                      return <IconComponent className={`w-6 h-6 ${defaultStatsConfig[index].textColor}`} />;
                    })()
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state with default structure
          defaultStatsConfig.map((config, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-gray-700 text-sm mb-2">{config.title}</h5>
                  <h3 className="text-2xl font-bold text-gray-400">-</h3>
                </div>
                <div className={`${config.bgColor} p-3 rounded-lg opacity-50`}>
                  <config.icon className={`w-6 h-6 ${config.textColor}`} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Chart Placeholder */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Salary And Attendance Chart</h4>
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
              <span className="text-gray-600">Chart data will be displayed here</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 animate-pulse">
                    <div className="w-3 h-3 bg-gray-200 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                    <span className={`w-3 h-3 ${activity.color || 'bg-gray-300'} rounded-full mt-2 flex-shrink-0`}></span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.text}</p>
                      <p className="text-sm text-gray-700">{activity.subtext}</p>
                      {activity.detail && <p className="text-sm text-gray-700">{activity.detail}</p>}
                    </div>
                    <span className="text-sm text-gray-600">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">No recent activities</div>
                <div className="text-sm text-gray-400">Activities will appear here when available</div>
              </div>
            )}
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
            <div className="mt-5 text-center text-xs text-gray-500">
              <CalendarReact />
            </div>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="xl:col-span-4 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Upcoming Holidays</h4>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 rounded-lg p-2 w-16 h-12"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : upcomingHolidays.length > 0 ? (
              <div className="space-y-4">
                {upcomingHolidays.map((holiday, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${holiday.color || 'bg-gray-100 text-gray-700'} rounded-lg p-2 text-center min-w-16`}>
                        <div className="text-lg font-bold">{holiday.date}</div>
                        <div className="text-xs">{holiday.month}</div>
                      </div>
                      <div>
                        <h6 className="font-semibold text-gray-900">{holiday.title}</h6>
                        <p className="text-sm text-gray-700">{holiday.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{holiday.days_left}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">No upcoming holidays</div>
                <div className="text-sm text-gray-400">Holiday information will appear here</div>
              </div>
            )}
          </div>
        </div>

        {/* Leave Balance */}
        <div className="xl:col-span-5 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Leave Balance</h4>
            <button 
              onClick={() => setActiveComponent("leave-application-entry")}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Apply Leaves
            </button>
          </div>
          <LeaveOverviewCard />
        </div>
      </div>

      {/* Upcoming Birthdays */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Upcoming Birthdays</h4>
            <button className="text-blue-600 text-sm hover:text-blue-800">View All</button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : upcomingBirthdays.length > 0 ? (
              <div className="space-y-4">
                {upcomingBirthdays.map((person, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded">
                        {person.avatar && (
                          <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded object-cover" />
                        )}
                      </div>
                      <div>
                        <h6 className="font-semibold text-gray-900">{person.name}</h6>
                        <p className="text-sm text-gray-700">{person.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm ${person.is_today ? 'text-green-700' : 'text-gray-600'}`}>
                        {person.status}
                      </span>
                      {person.is_today && (
                        <button className="block mt-1 bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs">
                          🎂 Wish Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">No upcoming birthdays</div>
                <div className="text-sm text-gray-400">Birthday information will appear here</div>
              </div>
            )}
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
                  {formatTime(currentTime)}
                </div>
                <label className="text-sm text-gray-700">Current Time</label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                <input 
                  type="text" 
                  value="Auto-detected"
                  disabled 
                  className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-gray-900" 
                />
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
                <textarea 
                  className="w-full p-2 border border-gray-200 rounded text-gray-900" 
                  rows="3" 
                  placeholder="Add any additional notes..."
                ></textarea>
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
    </div>
  );
}