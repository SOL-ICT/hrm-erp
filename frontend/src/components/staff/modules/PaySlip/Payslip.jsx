import { useState, useMemo, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Info, 
  Eye, 
  Download, 
  Printer, 
  Share2,
  X
} from 'lucide-react';

export default function Payslips() {
  const [payslipsData, setPayslipsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // API function placeholder - replace with actual API call
  const fetchPayslips = async () => {
    try {
      setLoading(true);
      // Replace this with your actual API endpoint
      // const response = await fetch('/api/payslips');
      // const data = await response.json();
      // setPayslipsData(data);
      
      // For now, set empty array
      setPayslipsData([]);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setPayslipsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleView = (payslip) => {
    setSelectedPayslip(payslip);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPayslip(null);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const filteredPayslips = useMemo(() => {
    if (!startDate || !endDate || payslipsData.length === 0) {
      return payslipsData;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return payslipsData.filter(payslip => {
      const payslipDate = new Date(payslip.date?.split('-').reverse().join('-'));
      return payslipDate >= start && payslipDate <= end;
    });
  }, [startDate, endDate, payslipsData]);

  const ActionButton = ({ icon: Icon, title, color, onClick }) => (
    <button
      className={`inline-flex items-center justify-center w-8 h-8 rounded text-white text-sm font-medium transition-colors duration-200 ${color} hover:opacity-90`}
      onClick={onClick}
      title={title}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
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

          {/* Date Range Filter */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Filter by Date:</span>
              <div className="flex items-center space-x-2">
                <label htmlFor="startDate" className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="endDate" className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading payslips...</span>
                </div>
              ) : filteredPayslips.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-2">No payslips found</div>
                  <div className="text-gray-400 text-sm">
                    {payslipsData.length === 0 
                      ? "No payslips available at this time" 
                      : "No payslips match the selected date range"
                    }
                  </div>
                </div>
              ) : (
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
                        Working Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Present
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Gross Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Net Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Performance Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Other Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Total Credit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayslips.map((payslip, index) => (
                      <tr key={payslip.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-center text-sm text-gray-900 border-b border-gray-200">
                          {payslip.id || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {payslip.month || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {payslip.year || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {payslip.working_days || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {payslip.present_days || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {payslip.absent_days || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {payslip.gross_salary || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {payslip.total_deductions || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {payslip.net_salary || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {payslip.performance_pay || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {payslip.other_income || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {payslip.total_credit || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          <div className="flex space-x-2">
                            <ActionButton
                              icon={Eye}
                              title="View"
                              color="bg-blue-600"
                              onClick={() => handleView(payslip)}
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
                              onClick={() => handleView(payslip)}
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAYSLIP MODAL */}
      {showModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-full print:overflow-visible">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Payslip View</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintPayslip}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Print
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Payslip Content */}
            <div className="p-6 bg-white text-gray-800">
              {/* Company Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedPayslip.company_name || 'Company Name'}
                </h1>
                <p className="text-sm text-gray-600">
                  {selectedPayslip.company_address || 'Company Address'}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedPayslip.company_phone || 'Company Phone'}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedPayslip.company_email || 'Company Email'}
                </p>
                <p className="text-lg text-blue-600 mt-4 font-semibold underline">
                  Pay slip for the period - {selectedPayslip.month} {selectedPayslip.year}
                </p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm">
                <div>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Emp. Code:</td>
                        <td className="py-2">{selectedPayslip.employee_code || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Department:</td>
                        <td className="py-2">{selectedPayslip.department || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Designation:</td>
                        <td className="py-2">{selectedPayslip.designation || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Grade:</td>
                        <td className="py-2">{selectedPayslip.grade || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">PF No:</td>
                        <td className="py-2">{selectedPayslip.pf_number || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Emp. Name:</td>
                        <td className="py-2">{selectedPayslip.employee_name || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Client Name:</td>
                        <td className="py-2">{selectedPayslip.client_name || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Service Place:</td>
                        <td className="py-2">{selectedPayslip.service_place || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Service Location:</td>
                        <td className="py-2">{selectedPayslip.service_location || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Working Day(s):</td>
                        <td className="py-2">{selectedPayslip.working_days || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Present Day(s):</td>
                        <td className="py-2">{selectedPayslip.present_days || '-'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-medium">Absent Day(s):</td>
                        <td className="py-2">{selectedPayslip.absent_days || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly Gross Salary */}
                <div className="border border-gray-300">
                  <h3 className="text-base font-bold bg-gray-100 p-3">MONTHLY GROSS SALARY</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-r border-gray-200 font-medium text-xs">Description</th>
                        <th className="text-right p-3 font-medium text-xs">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Basic Salary</td>
                        <td className="p-3 text-right">{selectedPayslip.basic_salary || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Housing Allowance</td>
                        <td className="p-3 text-right">{selectedPayslip.housing_allowance || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Transport Allowance</td>
                        <td className="p-3 text-right">{selectedPayslip.transport_allowance || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Medical</td>
                        <td className="p-3 text-right">{selectedPayslip.medical_allowance || '-'}</td>
                      </tr>
                      {selectedPayslip.other_allowances && selectedPayslip.other_allowances.map((allowance, index) => (
                        <tr key={index}>
                          <td className="p-3 border-r border-gray-200">{allowance.name}</td>
                          <td className="p-3 text-right">{allowance.amount}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-100">
                        <td className="p-3 border-r border-gray-200">Total (A)</td>
                        <td className="p-3 text-right">{selectedPayslip.gross_salary || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Monthly Deductions */}
                <div className="border border-gray-300">
                  <h3 className="text-base font-bold bg-gray-100 p-3">MONTHLY DEDUCTIONS</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-r border-gray-200 font-medium text-xs">Description</th>
                        <th className="text-right p-3 font-medium text-xs">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-r border-gray-200">PAYE Tax</td>
                        <td className="p-3 text-right">{selectedPayslip.paye_tax || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">NHIS</td>
                        <td className="p-3 text-right">{selectedPayslip.nhis || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">ITF</td>
                        <td className="p-3 text-right">{selectedPayslip.itf || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Pension</td>
                        <td className="p-3 text-right">{selectedPayslip.pension || '-'}</td>
                      </tr>
                      {selectedPayslip.other_deductions && selectedPayslip.other_deductions.map((deduction, index) => (
                        <tr key={index}>
                          <td className="p-3 border-r border-gray-200">{deduction.name}</td>
                          <td className="p-3 text-right">{deduction.amount}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-100">
                        <td className="p-3 border-r border-gray-200">Total (B)</td>
                        <td className="p-3 text-right">{selectedPayslip.total_deductions || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Monthly Credit to Bank */}
                <div className="border border-gray-300">
                  <h3 className="text-base font-bold bg-gray-100 p-3">MONTHLY CREDIT TO BANK</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-r border-gray-200 font-medium text-xs">Description</th>
                        <th className="text-right p-3 font-medium text-xs">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Net Monthly Salary</td>
                        <td className="p-3 text-right">{selectedPayslip.net_salary || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Performance Pay</td>
                        <td className="p-3 text-right">{selectedPayslip.performance_pay || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Other Income</td>
                        <td className="p-3 text-right">{selectedPayslip.other_income || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-200">Operational Reimbursable</td>
                        <td className="p-3 text-right">{selectedPayslip.operational_reimbursable || '-'}</td>
                      </tr>
                      <tr className="font-bold bg-gray-100">
                        <td className="p-3 border-r border-gray-200">Total (F)</td>
                        <td className="p-3 text-right">{selectedPayslip.total_credit || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Categories of Staff */}
              <div className="mt-10">
                <h3 className="text-sm font-bold mb-2">CATEGORIES OF STAFF</h3>
                <p className="text-xs text-gray-600 mb-4">
                  SOL has three categories of staff distinguished by the compensation system.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="p-4 border rounded-md">
                    <h4 className="font-bold mb-2">Salaried employees</h4>
                    <p className="text-gray-600 mb-2">
                      Employees that receive a fixed gross annual salary with a net salary payable 
                      in equal installments after the deduction of income tax, employees contribution 
                      to social insurance and other statutory deductions.
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>A. Gross Salary</li>
                      <li>B. Deduction</li>
                      <li>C. Net Salary</li>
                      <li>D. Performance Pay</li>
                      <li>E. Operational Reimbursable Expense</li>
                      <li>F. Credit To Bank</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-md">
                    <h4 className="font-bold mb-2">Piece rate employees</h4>
                    <p className="text-gray-600 mb-2">
                      Remuneration is computed on the actual performance on the job. The remuneration 
                      varies from time to time, and the gross annual income is only determinable at the 
                      end of the year.
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>A. Piece rate Income</li>
                      <li>B. Deduction of PAYE remittance</li>
                      <li>C. Net Pay</li>
                      <li>D. Other Income</li>
                      <li>E. Operational Reimbursable Expense</li>
                      <li>F. Credit To Bank</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-md">
                    <h4 className="font-bold mb-2">Commissioned employees</h4>
                    <p className="text-gray-600 mb-2">
                      Staff receive a combination of a nominal fixed gross annual salary and 
                      performance incentive computed based on actual performance.
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>A. Gross salary</li>
                      <li>B. Deduction</li>
                      <li>C. Net salary</li>
                      <li>D. Performance Pay</li>
                      <li>E. Other income</li>
                      <li>F. Credit To Bank</li>
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-6 text-center">
                  Payslip is system generated and does not require a stamp or signature.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}