import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation"; // Importing the router
import { useNavigation } from '@/components/staff/components/NavigationContext'; 
import { 
  Menu, 
  X, 
  Search, 
  Sun, 
  Moon, 
  Maximize, 
  Minimize, 
  Mail, 
  Bell, 
  Settings,
  User,
  MessageSquare,
  Edit2,
  LogOut,
  MoreVertical
} from 'lucide-react';

export default function StaffHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  setActiveComponent
}) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isFlagsOpen, setIsFlagsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  //user
    const { user, logout } = useAuth();

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setIsProfileOpen(false);
    setIsMessagesOpen(false);
    setIsFlagsOpen(false);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.log('Error attempting to exit fullscreen:', err);
      });
    }
  };

  // Handle sidebar toggle for desktop
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle mobile sidebar toggle
  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const messages = [
    { name: 'Jack Wright', message: 'All the best your template awesome', time: '3 hours ago', avatar: 'JW' },
    { name: 'Lisa Rutherford', message: 'Hey! there I\'m available', time: '5 hour ago', avatar: 'LR' },
    { name: 'Blake Walker', message: 'Just created a new blog post', time: '45 minutes ago', avatar: 'BW' },
    { name: 'Fiona Morrison', message: 'Added new comment on your photo', time: '2 days ago', avatar: 'FM' },
    { name: 'Stewart Bond', message: 'Your payment invoice is generated', time: '3 days ago', avatar: 'SB' }
  ];

  const countries = [
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'UK', code: 'GB', flag: '🇬🇧' },
    { name: 'Italy', code: 'IT', flag: '🇮🇹' },
    { name: 'US', code: 'US', flag: '🇺🇸' },
    { name: 'Spain', code: 'ES', flag: '🇪🇸' }
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Brand and Sidebar Toggle */}
          <div className="flex items-center space-x-4">

           {/* Sidebar Toggle - Connected to sidebar state */}
            <div className="flex items-center">
              {/* Mobile Sidebar Toggle */}
              <button 
                onClick={handleMobileSidebarToggle}
                className="md:hidden p-2 hover:bg-gray-100 rounded-md"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Desktop Sidebar Toggle */}
              <button 
                onClick={handleSidebarToggle}
                className="hidden md:block p-2 hover:bg-gray-100 rounded-md"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Brand Logo */}
            <a href="#" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">SOL</span>
              </div>
              <span className="hidden md:block text-xl font-semibold text-gray-800">Strategic Outsourcing Limited</span>
            </a>
            

          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search…"
                className="w-full px-4 py-2 pl-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-0 top-0 bottom-0 px-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Section - Icons and Profile */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {/* Desktop Navigation */}
            <div className={`${isNavOpen ? 'block' : 'hidden'} md:flex items-center space-x-2 absolute md:relative top-16 md:top-0 right-0 md:right-auto bg-white md:bg-transparent border md:border-0 rounded-md shadow-lg md:shadow-none p-4 md:p-0 min-w-48 md:min-w-0`}>
              
              {/* Mobile Search Toggle */}
              <button 
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className="md:hidden w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
              >
                <Search className="w-5 h-5 text-gray-600" />
                <span>Search</span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-gray-600" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              {/* Country/Language Dropdown */}
              {/* <div className="relative">
                <button 
                  onClick={() => {
                    closeAllDropdowns();
                    setIsFlagsOpen(!isFlagsOpen);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <span className="text-lg">🇬🇧</span>
                </button>
                {isFlagsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => setIsFlagsOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-sm">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div> */}

              {/* Fullscreen Toggle */}
              <button 
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 text-gray-600" /> : <Maximize className="w-5 h-5 text-gray-600" />}
              </button>

              {/* Messages Dropdown */}
              {/* <div className="relative">
                <button 
                  onClick={() => {
                    closeAllDropdowns();
                    setIsMessagesOpen(!isMessagesOpen);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-md relative"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">5</span>
                </button>
                {isMessagesOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="max-h-64 overflow-y-auto">
                      {messages.map((msg, index) => (
                        <div key={index} className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {msg.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h6 className="text-sm font-medium text-gray-900 truncate">{msg.name}</h6>
                            <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                            <div className="text-xs text-gray-400">{msg.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center p-2 border-t">
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800">See All Messages</a>
                    </div>
                  </div>
                )}
              </div> */}

              {/* Notifications */}
              {/* <button className="p-2 hover:bg-gray-100 rounded-md relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button> */}

{/* Profile Dropdown */}
<div className="relative">
  <button 
    onClick={() => {
      closeAllDropdowns();
      setIsProfileOpen(!isProfileOpen);
    }}
    className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md"
  >
    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
      <User className="w-4 h-4 text-gray-600" />
    </div>
  </button>

  {isProfileOpen && (
    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
      <div className="p-4 border-b border-gray-200 text-center">
        <h6 className="font-semibold text-gray-900">{user?.name || "Loading..."}</h6>
        <p className="text-sm text-gray-600">App Developer</p>
      </div>
      <div className="py-2">
        {/* Profile Link as a Button */}
        <button 
          onClick={() => setActiveComponent("settings")} 
          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50"
        >
          <User className="w-4 h-4 text-gray-900" />
          <span className="text-sm text-gray-900">Profile</span>
        </button>

        {/* Settings Link as a Button */}
        <button 
          onClick={() => setActiveComponent("settings")} 
          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50"
        >
          <Settings className="w-4 h-4 text-gray-900" />
          <span className="text-sm text-gray-900">Settings</span>
        </button>

        {/* Messages Link */}
        <button 
          onClick={() => setActiveComponent("settings")} 
          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50"
        >
          <MessageSquare className="w-4 h-4 text-gray-900" />
          <span className="text-sm text-gray-900">Messages</span>
        </button>

        {/* Change Password Link */}
        <button 
        // empty for now 
          onClick={() => setActiveComponent("settings")} 
          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50"
        >
          <Edit2 className="w-4 h-4 text-gray-900" />
          <span className="text-sm text-gray-900">Change Password</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full text-left flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )}
</div>

              {/* Settings Icon */}
              <button className="p-2 hover:bg-gray-100 rounded-md"
                onClick={() => setActiveComponent("settings")}
              >
               
                <Settings className="w-5 h-5 text-gray-600 animate-spin" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchVisible && (
          <div className="md:hidden py-4 border-t">
            <div className="relative">
              <input
                type="search"
                placeholder="Search…"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-2 top-2 p-1">
                <Search className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}