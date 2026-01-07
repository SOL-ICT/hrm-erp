import { useState,useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/components/staff/components/NavigationContext'; 
import { Lock, User, Palette, Shield, Eye, EyeOff, Check, X, AlertCircle, Moon, Sun, Monitor, Bell, Smartphone, Clock } from 'lucide-react';
import { apiService } from '@/services/api';

export default function SettingsPage() {
  // const [activeTab, setActiveTab] = useState('password');
  //const { activeSettingsTab: activeTab, setActiveSettingsTab: setActiveTab } = useNavigation(); // Global state
  // const [activeTab, setActiveTab] = useState('password');
   // Guard navigation context (avoid crash when provider is not present)
  const nav = useNavigation(); // may return null
  //const activeTab = nav?.activeSettingsTab ?? 'password';
 // const setActiveTab = nav?.setActiveSettingsTab ?? (() => {});
  const [localActiveTab, setLocalActiveTab] = useState('password');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  


  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  //profile data states
const [profileData, setProfile] = useState({});
const [isLoading, setIsLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState('');
const { user } = useAuth();


  useEffect(() => {
    if (nav?.activeSettingsTab) setLocalActiveTab(nav.activeSettingsTab);
  }, [nav?.activeSettingsTab]);
  const activeTab = nav?.activeSettingsTab ?? localActiveTab;
  const setActiveTab = nav?.setActiveSettingsTab ?? setLocalActiveTab;


useEffect(() => {
  const fetchUserProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Fire-and-forget CSRF prefetch: don't block profile fetch if it fails
      apiService.makeRequest('sanctum/csrf-cookie').catch((err) => {
        console.warn('CSRF prefetch failed (ignored):', err?.message || err);
      });

      // Use the apiService which returns parsed JSON (or throws on non-OK)
      const data = await apiService.makeRequest('staff/staff-profiles/me', { method: 'GET' });

      console.log('[FETCH] Profile data:', data);

      // Defensive handling: backend sometimes returns an array; pick first item
      if (Array.isArray(data)) {
        setProfile(data[0] || null);
      } else {
        setProfile(data || null);
      }
    } catch (error) {
      console.error('[FETCH] Error fetching profile:', error);

      if (error?.message && error.message.toLowerCase().includes('401')) {
        setErrorMessage('Authentication failed. Please log in again.');
      } else {
        setErrorMessage('An error occurred while fetching the profile.');
      }

      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchUserProfile();
}, [user?.id]); 

  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile Overview', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'theme', label: 'Theme Preference', icon: Palette },
    { id: 'security', label: 'Security & Activity', icon: Shield }
  ];

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(passwordForm.new);
  const passwordsMatch = passwordForm.new === passwordForm.confirm && passwordForm.confirm !== '';
  const allChecksPass = Object.values(passwordChecks).every(v => v);

  const PasswordStrengthIndicator = ({ checks }) => {
    const passedCount = Object.values(checks).filter(v => v).length;
    const strength = passedCount <= 2 ? 'weak' : passedCount <= 4 ? 'medium' : 'strong';
    const colors = { weak: 'bg-red-500', medium: 'bg-yellow-500', strong: 'bg-green-500' };
    
    return (
      <div className="space-y-2">
        <div className="flex gap-1 h-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex-1 rounded-full ${i <= passedCount ? colors[strength] : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-600 capitalize">{passwordForm.new && `Password strength: ${strength}`}</p>
      </div>
    );
  };

  const ValidationCheck = ({ passed, label }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-gray-300" />
      )}
      <span className={passed ? 'text-green-700' : 'text-gray-500'}>{label}</span>
    </div>
  );

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (allChecksPass && passwordsMatch && passwordForm.current) {
      alert('Password changed successfully!');
      setPasswordForm({ current: '', new: '', confirm: '' });
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Change Password</h2>
              
              {/* Security Tip */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Security Tip</h3>
                  <p className="text-sm text-blue-800">
                    Use a strong password with a mix of letters, numbers, and symbols. Avoid using personal information or common words.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordForm.new && (
                    <div className="mt-3">
                      <PasswordStrengthIndicator checks={passwordChecks} />
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                {passwordForm.new && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-3">Password must contain:</p>
                    <ValidationCheck passed={passwordChecks.length} label="At least 8 characters" />
                    <ValidationCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                    <ValidationCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                    <ValidationCheck passed={passwordChecks.number} label="One number" />
                    <ValidationCheck passed={passwordChecks.special} label="One special character" />
                  </div>
                )}

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordForm.confirm && (
                    <p className={`mt-2 text-sm flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordsMatch ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!allChecksPass || !passwordsMatch || !passwordForm.current}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* Profile Overview Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Overview</h2>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : errorMessage ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errorMessage}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Profile Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                          {profileData.first_name && profileData.last_name 
                            ? `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}` 
                            : 'JD'}
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">
                            {profileData.first_name} {profileData.last_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Employee Code: {profileData.employee_code}</p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <p className="text-gray-900">
                            {profileData.first_name} {profileData.middle_name || ''} {profileData.last_name}
                          </p>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <p className="text-gray-900">{profileData.email}</p>
                        </div>

                        {/* Employee Code */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                          <p className="text-gray-900">{profileData.employee_code}</p>
                        </div>

                        {/* Designation */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <p className="text-gray-900 capitalize">{profileData.designation}</p>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <p className="text-gray-900">{profileData.mobile_phone || 'Not provided'}</p>
                        </div>

                        {/* Entry Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date</label>
                          <p className="text-gray-900">
                            {profileData.entry_date ? new Date(profileData.entry_date).toLocaleDateString() : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-gray-900">{profileData.location || 'Not provided'}</p>
                        </div>

                        {/* Current Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                          <p className="text-gray-900">{profileData.current_address || 'Not provided'}</p>
                        </div>

                        {/* State of Residence */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State of Residence</label>
                          <p className="text-gray-900">{profileData.state_of_residence || 'Not provided'}</p>
                        </div>

                        {/* Marital Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                          <p className="text-gray-900 capitalize">{profileData.marital_status || 'Not provided'}</p>
                        </div>

                        {/* National ID */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">National ID Number</label>
                          <p className="text-gray-900">{profileData.national_id_no || 'Not provided'}</p>
                        </div>

                        {/* Account Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                          <p className="text-gray-900">{profileData.account_number || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Theme Preference Tab */}
          {activeTab === 'theme' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Theme Preference</h2>
              <p className="text-gray-600 mb-6">Choose how the interface looks for you</p>

              <div className="space-y-4">
                {/* Light Theme */}
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center gap-4 transition-all ${
                    theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-white border-2 flex items-center justify-center ${
                    theme === 'light' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    <Sun className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">Light</h3>
                    <p className="text-sm text-gray-600">Bright and clear interface</p>
                  </div>
                  {theme === 'light' && <Check className="w-6 h-6 text-blue-600" />}
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center gap-4 transition-all ${
                    theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gray-900 border-2 flex items-center justify-center ${
                    theme === 'dark' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    <Moon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">Dark</h3>
                    <p className="text-sm text-gray-600">Easy on the eyes in low light</p>
                  </div>
                  {theme === 'dark' && <Check className="w-6 h-6 text-blue-600" />}
                </button>

                {/* System Theme */}
                <button
                  onClick={() => setTheme('system')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center gap-4 transition-all ${
                    theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 border-2 flex items-center justify-center ${
                    theme === 'system' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">System</h3>
                    <p className="text-sm text-gray-600">Automatically match your device settings</p>
                  </div>
                  {theme === 'system' && <Check className="w-6 h-6 text-blue-600" />}
                </button>
              </div>

              {/* Notification Preferences */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-600">Get notified on your device</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive text messages</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security & Activity Tab */}
          {activeTab === 'security' && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Security & Activity</h2>
              <p className="text-gray-600 mb-6">Monitor your account security and recent activity</p>

              {/* Two-Factor Authentication */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-1">Enabled</h4>
                    <p className="text-sm text-green-800 mb-3">
                      Your account is protected with two-factor authentication
                    </p>
                    <button className="text-sm text-green-700 font-medium hover:text-green-800">
                      Manage 2FA Settings →
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              {/* <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Windows PC - Chrome</p>
                          <p className="text-sm text-gray-600">Lagos, Nigeria</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Current session
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">iPhone 14 - Safari</p>
                          <p className="text-sm text-gray-600">Lagos, Nigeria</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last active 2 hours ago
                          </p>
                        </div>
                      </div>
                      <button className="text-sm text-red-600 font-medium hover:text-red-700">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Recent Activity */}
              {/* <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Password changed', time: '2 days ago', icon: Lock },
                    { action: 'Logged in from new device', time: '5 days ago', icon: Smartphone },
                    { action: 'Profile information updated', time: '1 week ago', icon: User },
                    { action: 'Two-factor authentication enabled', time: '2 weeks ago', icon: Shield }
                  ].map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div> */}



              {/* Danger Zone */}
              {/* <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                <div className="border-2 border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}