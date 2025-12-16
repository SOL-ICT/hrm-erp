/**
 * Stats Card Component
 * 
 * Displays key statistics with icon, value, and optional subtitle.
 * Compact design with hover effect and dark mode support.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Styling Guidelines
 */

interface StatsCardProps {
  title: string;
  value: string | number;
  color: 'gray' | 'orange' | 'red' | 'green';
  icon: string;
  subtitle?: string;
}

export default function StatsCard({ title, value, color, icon, subtitle }: StatsCardProps) {
  const colorClasses = {
    gray: 'text-gray-900 dark:text-gray-100',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {title}
          </h3>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-2xl ml-3">
          {icon}
        </div>
      </div>
    </div>
  );
}
