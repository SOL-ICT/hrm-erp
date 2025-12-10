import React, { createContext, useContext, useState } from 'react';

// Create the context object
const NavigationContext = createContext(null);

// Custom hook for consuming the context
export const useNavigation = () => useContext(NavigationContext);

// Provider component that wraps your entire application
export const NavigationProvider = ({ children }) => {
  // 1. State for the current major page/component ('dashboard' or 'settings')
  const [activeComponent, setActiveComponent] = useState('dashboard');
  
  // 2. State for the specific tab within the settings page ('profile', 'password', etc.)
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile'); 

  // Combined function used by components like the Header to navigate
  const navigateTo = (componentId, tabId = 'profile') => {
    setActiveComponent(componentId);
    if (componentId === 'settings') {
      setActiveSettingsTab(tabId);
    }
  };

  const contextValue = {
    activeComponent,
    activeSettingsTab,
    navigateTo, // Used by Header
    setActiveSettingsTab, // Used by SettingsPage for internal tab switching
    setActiveComponent // Used for simple page changes
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};
