// Basic UI Components for Invoice Management
import React from "react";

// Card Components
export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 pb-0 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

// Button Component
export const Button = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  disabled = false,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = ({
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  icon,
}) => (
  <div className="relative">
    {icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <div className="text-gray-400">{icon}</div>
      </div>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        icon ? "pl-10" : ""
      } ${className}`}
    />
  </div>
);

// Select Components
export const Select = ({ children, value, onValueChange, className = "" }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 ${className}`}
    >
      {children}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </div>
);

// Fixed SelectTrigger - should not be used inside Select component
export const SelectTrigger = ({ children, className = "", onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between ${className}`}
  >
    {children}
    <svg
      className="w-4 h-4 text-gray-400 ml-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>
);

// SelectValue should be used as placeholder text, not as option
export const SelectValue = ({ placeholder = "Select an option..." }) => (
  <span className="text-gray-500">{placeholder}</span>
);

// SelectContent for dropdown items container
export const SelectContent = ({ children, className = "" }) => (
  <div
    className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}
  >
    {children}
  </div>
);

// SelectItem for individual options
export const SelectItem = ({ value, children, onClick }) => (
  <option value={value} onClick={onClick}>
    {children}
  </option>
);

// Badge Component
export const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

// Table Components
export const Table = ({ children, className = "" }) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children }) => (
  <thead className="bg-gray-50">{children}</thead>
);

export const TableBody = ({ children }) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

export const TableRow = ({ children, className = "" }) => (
  <tr className={className}>{children}</tr>
);

export const TableHead = ({ children, className = "" }) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = "" }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
    {children}
  </td>
);

// Dialog Components
export const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export const DialogTrigger = ({ children, asChild, ...props }) => (
  <div {...props}>{children}</div>
);

export const DialogContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const DialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

// Alert Components
export const Alert = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-blue-50 border-blue-200 text-blue-700",
    destructive: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className={`rounded-md border p-4 ${variants[variant]}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);

// Tabs Components
export const Tabs = ({ children, defaultValue, className = "" }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab }) => (
  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
);

export const TabsTrigger = ({ children, value, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === value
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-600 hover:text-gray-900"
    }`}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, value, activeTab }) => {
  if (activeTab !== value) return null;
  return <div>{children}</div>;
};

// Progress Component
export const Progress = ({ value = 0, max = 100, className = "" }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, className = "" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto w-full max-w-4xl mx-4 ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
