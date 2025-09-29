import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Info, 
  Eye, 
  Download, 
  Printer, 
  Share2 
} from 'lucide-react';

const payslipsData = [
  { id: '#10029', month: 'January', year: '2021', salary: '$32,000', date: '01-02-2021' },
  { id: '#10321', month: 'December', year: '2020', salary: '$28,000', date: '01-01-2021' },
  { id: '#10598', month: 'November', year: '2020', salary: '$28,000', date: '01-12-2020' },
  { id: '#10438', month: 'October', year: '2020', salary: '$28,000', date: '01-11-2020' },
  { id: '#10837', month: 'September', year: '2020', salary: '$28,000', date: '01-10-2020' },
  { id: '#10391', month: 'August', year: '2020', salary: '$28,000', date: '01-09-2020' },
  { id: '#11073', month: 'July', year: '2020', salary: '$28,000', date: '02-08-2020' },
  { id: '#10839', month: 'June', year: '2020', salary: '$28,000', date: '02-07-2020' },
  { id: '#10289', month: 'May', year: '2020', salary: '$28,000', date: '01-06-2020' },
  { id: '#10422', month: 'April', year: '2020', salary: '$28,000', date: '01-05-2020' },
  { id: '#10029', month: 'March', year: '2020', salary: '$24,000', date: '01-04-2020' },
  { id: '#10398', month: 'February', year: '2020', salary: '$24,000', date: '01-03-2020' },
  { id: '#10092', month: 'January', year: '2020', salary: '$24,000', date: '01-02-2020' },
  { id: '#11986', month: 'December', year: '2019', salary: '$24,000', date: '01-01-2020' },
  { id: '#10029', month: 'November', year: '2019', salary: '$24,000', date: '01-12-2019' },
];

export default function Payslips() {
  const [hoveredButton, setHoveredButton] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const ActionButton = ({ icon: Icon, title, color, onClick }) => (
    <button
      className={`inline-flex items-center justify-center w-8 h-8 rounded text-white text-sm font-medium transition-colors duration-200 ${color} hover:opacity-90`}
      onMouseEnter={() => setHoveredButton(title)}
      onMouseLeave={() => setHoveredButton(null)}
      onClick={onClick}
      title={title}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-6">
        <div className="mb-4 xl:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">Payslips</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
            title="E-mail"
          >
            <Mail size={18} />
          </button>
          <button
            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
            title="Contact"
          >
            <Phone size={18} />
          </button>
          <button
            className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 border border-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors duration-200"
            title="Info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">My Payslips Summary</h4>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      #ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      $ Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Generated Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payslipsData.map((payslip, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-center text-sm text-gray-900 border-b border-gray-200">
                        {payslip.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        {payslip.month}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        {payslip.year}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                        {payslip.salary}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        {payslip.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        <div className="flex space-x-2">
                          <ActionButton
                            icon={Eye}
                            title="View"
                            color="bg-blue-600"
                            onClick={() => console.log('View clicked')}
                          />
                          <ActionButton
                            icon={Download}
                            title="Download"
                            color="bg-green-600"
                            onClick={() => console.log('Download clicked')}
                          />
                          <ActionButton
                            icon={Printer}
                            title="Print"
                            color="bg-cyan-600"
                            onClick={handlePrint}
                          />
                          <ActionButton
                            icon={Share2}
                            title="Share"
                            color="bg-yellow-500"
                            onClick={() => console.log('Share clicked')}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}