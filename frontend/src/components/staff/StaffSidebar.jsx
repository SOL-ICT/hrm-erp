"use client"; // Client-side for interactivity

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  User,
  Calendar,
  DollarSign,
  Edit,
  BookOpen,
  Star,
  Bell,
  FileText,
  Users,
} from "lucide-react";

// We've added a `componentKey` to each menu item and child.
// This is the value that will be passed to the parent component's state.

const menuItems = [
  {
    title: "Dashboard",
    icon: <User className="h-5 w-5" />,
    componentKey: "dashboard",
  },
  {
    title: "Leave Administration",
    icon: <Calendar className="h-5 w-5" />,
    children: [
      {
        title: "Leave Application Entry",
        componentKey: "leave-application-entry",
      },
      { title: "HOD Leave Approval List", componentKey: "my-leaves" },
    ],
  },
  {
    title: "Pay slip Access",
    icon: <DollarSign className="h-5 w-5" />,
    children: [
      { title: "Pay slip View & Print", componentKey: "payslip-view-print" },
    ],
  },
  {
    title: "HR & Payroll Management",
    icon: <Users className="h-5 w-5" />,
    children: [
      { title: "Invoice Management", componentKey: "invoice-management" },
      { title: "Employee Records", componentKey: "employee-records" },
    ],
  },
  {
    title: "Staff Change Request",
    icon: <Edit className="h-5 w-5" />,
    children: [
      {
        title: "Name Change Application",
        componentKey: "name-change-application",
      },
      {
        title: "Misc Information Change Application",
        componentKey: "misc-change-application",
      },
      {
        title: "Staff Misc. Information Change",
        componentKey: "staff-misc-change",
      },
      {
        title: "Request Approval Record",
        componentKey: "request-approval-record",
      },
    ],
  },
  {
    title: "Training & Development",
    icon: <BookOpen className="h-5 w-5" />,
    children: [
      { title: "Training Feedback", componentKey: "training-feedback" },
    ],
  },
  {
    title: "Staff Appraisal",
    icon: <Star className="h-5 w-5" />,
    children: [
      {
        title: "Staff Appraisal Initiation Entry",
        componentKey: "staff-appraisal-initiation",
      },
      {
        title: "Appraisal - Supervisor Feedback",
        componentKey: "appraisal-supervisor-feedback",
      },
    ],
  },
  {
    title: "Notices & Messages",
    icon: <Bell className="h-5 w-5" />,
    children: [{ title: "HR Announcement", componentKey: "hr-announcement" }],
  },
];

// The component now accepts sidebar state management props from StaffLayout.
export default function StaffSidebar({
  activeComponent,
  setActiveComponent,
  isOpen,
  setIsOpen,
  isMobileOpen,
  setIsMobileOpen,
}) {
  //username
  const { user } = useAuth();

  const [expandedSections, setExpandedSections] = useState([]);

  useEffect(() => {
    // We can still use this effect to auto-expand the parent section of the active component
    menuItems.forEach((section) => {
      const isChildActive = section.children?.some(
        (child) => activeComponent === child.componentKey
      );
      if (isChildActive && !expandedSections.includes(section.title)) {
        setExpandedSections((prev) => [...prev, section.title]);
      }
    });
  }, [activeComponent]);

  const toggleSection = (title) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (key) => activeComponent === key;

  const handleMenuClick = (key) => {
    setActiveComponent(key);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Collapse Toggle Button */}
      {/* <button
        className={`fixed top-4 p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md z-50 hidden md:block transition-all duration-300 ${
          isOpen ? "left-60" : "left-12"
        } hover:bg-blue-600`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
      </button> */}

      {/* Sidebar */}
      <aside
        className={`bg-white text-gray-800 h-screen fixed top-0 overflow-y-auto transition-all duration-300 ease-in-out z-40 shadow-lg ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:top-0 ${isOpen ? "w-64" : "w-16"}`}
        style={{ transitionProperty: "width, transform" }}
      >
        {/* User Profile */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div
              className={`h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ${
                !isOpen && "mx-auto"
              } transition-all duration-200`}
            >
              <User className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <div className="flex-1">
                <h2 className="font-semibold text-base text-gray-800">
                  {user?.name || "Loading..."}
                </h2>
                <p className="text-xs text-gray-500">App Developer</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Sections */}
        <nav className="mt-4">
          {menuItems.map((section) => {
            const isExpanded = expandedSections.includes(section.title);
            const isSectionActive =
              section.children?.some((child) => isActive(child.componentKey)) ||
              isActive(section.componentKey);

            return (
              <div key={section.title}>
                <button
                  onClick={() => {
                    toggleSection(section.title);
                    if (section.componentKey) {
                      handleMenuClick(section.componentKey);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 ${
                    isSectionActive ? "bg-blue-100 text-blue-700" : ""
                  } ${!isOpen && "justify-center"}`}
                  aria-expanded={isExpanded}
                >
                  <div
                    className={`flex items-center space-x-3 ${
                      !isOpen && "space-x-0"
                    }`}
                  >
                    {section.icon}
                    {isOpen && (
                      <span className="text-sm font-medium">
                        {section.title}
                      </span>
                    )}
                  </div>
                  {isOpen &&
                    section.children &&
                    (isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    ))}
                </button>
                {isOpen && isExpanded && section.children && (
                  <ul className="ml-6 space-y-1">
                    {section.children.map((child) => (
                      <li key={child.title}>
                        <button
                          onClick={() => handleMenuClick(child.componentKey)}
                          className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors duration-150 ${
                            isActive(child.componentKey)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-600"
                          }`}
                        >
                          {child.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile when open */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
