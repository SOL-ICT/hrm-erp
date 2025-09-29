import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Alert,
  AlertDescription,
} from "../ui";
import { invoiceApiService } from "../../services/modules/invoicing";
import {
  Users,
  Calculator,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const InvoiceLineItemsTable = ({ invoiceId }) => {
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    if (invoiceId) {
      loadLineItems();
    }
  }, [invoiceId]);

  const loadLineItems = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate line items data
      // In production, this would call an API endpoint like:
      // const response = await invoiceApiService.getInvoiceLineItems(invoiceId);

      // Simulated data structure
      const simulatedData = [
        {
          id: 1,
          employee_id: "EMP001",
          employee_name: "John Doe",
          designation: "Software Developer",
          days_worked: 22,
          hours_worked: 176,
          basic_salary: 300000,
          allowances: 90000,
          gross_pay: 390000,
          paye_tax: 45000,
          nhf_deduction: 7500,
          nsitf_deduction: 975,
          other_deductions: 5000,
          total_deductions: 58475,
          net_pay: 331525,
          breakdown: {
            overtime_hours: 16,
            overtime_rate: 2500,
            overtime_pay: 40000,
            transport_allowance: 25000,
            meal_allowance: 15000,
            housing_allowance: 10000,
          },
        },
        {
          id: 2,
          employee_id: "EMP002",
          employee_name: "Jane Smith",
          designation: "Project Manager",
          days_worked: 20,
          hours_worked: 160,
          basic_salary: 400000,
          allowances: 120000,
          gross_pay: 520000,
          paye_tax: 65000,
          nhf_deduction: 10000,
          nsitf_deduction: 1300,
          other_deductions: 8000,
          total_deductions: 84300,
          net_pay: 435700,
          breakdown: {
            overtime_hours: 0,
            overtime_rate: 0,
            overtime_pay: 0,
            transport_allowance: 40000,
            meal_allowance: 20000,
            housing_allowance: 60000,
          },
        },
        {
          id: 3,
          employee_id: "EMP003",
          employee_name: "Mike Johnson",
          designation: "Business Analyst",
          days_worked: 21,
          hours_worked: 168,
          basic_salary: 250000,
          allowances: 75000,
          gross_pay: 325000,
          paye_tax: 35000,
          nhf_deduction: 6250,
          nsitf_deduction: 812,
          other_deductions: 3000,
          total_deductions: 45062,
          net_pay: 279938,
          breakdown: {
            overtime_hours: 8,
            overtime_rate: 2000,
            overtime_pay: 16000,
            transport_allowance: 20000,
            meal_allowance: 15000,
            housing_allowance: 24000,
          },
        },
      ];

      setLineItems(simulatedData);
    } catch (error) {
      setError("Failed to load line items: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (itemId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(itemId)) {
      newExpandedRows.delete(itemId);
    } else {
      newExpandedRows.add(itemId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedLineItems = React.useMemo(() => {
    if (!sortConfig.key) return lineItems;

    return [...lineItems].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [lineItems, sortConfig]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading employee details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const totals = lineItems.reduce(
    (acc, item) => ({
      gross_pay: acc.gross_pay + item.gross_pay,
      total_deductions: acc.total_deductions + item.total_deductions,
      net_pay: acc.net_pay + item.net_pay,
      days_worked: acc.days_worked + item.days_worked,
      hours_worked: acc.hours_worked + item.hours_worked,
    }),
    {
      gross_pay: 0,
      total_deductions: 0,
      net_pay: 0,
      days_worked: 0,
      hours_worked: 0,
    }
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {lineItems.length}
                </p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-xl font-bold text-gray-900">
                  {totals.days_worked}
                </p>
              </div>
              <Calculator className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Gross Payroll
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totals.gross_pay)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Payroll</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totals.net_pay)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Employee Breakdown
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Details
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("employee_name")}
                  >
                    <div className="flex items-center">
                      Employee {getSortIcon("employee_name")}
                    </div>
                  </TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 text-right"
                    onClick={() => handleSort("days_worked")}
                  >
                    <div className="flex items-center justify-end">
                      Days {getSortIcon("days_worked")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 text-right"
                    onClick={() => handleSort("gross_pay")}
                  >
                    <div className="flex items-center justify-end">
                      Gross Pay {getSortIcon("gross_pay")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 text-right"
                    onClick={() => handleSort("total_deductions")}
                  >
                    <div className="flex items-center justify-end">
                      Deductions {getSortIcon("total_deductions")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 text-right"
                    onClick={() => handleSort("net_pay")}
                  >
                    <div className="flex items-center justify-end">
                      Net Pay {getSortIcon("net_pay")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLineItems.map((item) => (
                  <React.Fragment key={item.id}>
                    {/* Main Row */}
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(item.id)}
                          className="p-0 h-6 w-6"
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">
                            {item.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.employee_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.designation}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-semibold">
                            {item.days_worked}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.hours_worked}h
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.gross_pay)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        -{formatCurrency(item.total_deductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(item.net_pay)}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details Row */}
                    {expandedRows.has(item.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Earnings Breakdown */}
                            <div>
                              <h5 className="font-semibold mb-3 text-green-700">
                                Earnings
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Basic Salary:</span>
                                  <span>
                                    {formatCurrency(item.basic_salary)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Transport Allowance:</span>
                                  <span>
                                    {formatCurrency(
                                      item.breakdown.transport_allowance
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Meal Allowance:</span>
                                  <span>
                                    {formatCurrency(
                                      item.breakdown.meal_allowance
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Housing Allowance:</span>
                                  <span>
                                    {formatCurrency(
                                      item.breakdown.housing_allowance
                                    )}
                                  </span>
                                </div>
                                {item.breakdown.overtime_pay > 0 && (
                                  <div className="flex justify-between">
                                    <span>
                                      Overtime ({item.breakdown.overtime_hours}
                                      h):
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        item.breakdown.overtime_pay
                                      )}
                                    </span>
                                  </div>
                                )}
                                <hr />
                                <div className="flex justify-between font-semibold">
                                  <span>Total Earnings:</span>
                                  <span>{formatCurrency(item.gross_pay)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Deductions Breakdown */}
                            <div>
                              <h5 className="font-semibold mb-3 text-red-700">
                                Deductions
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>PAYE Tax:</span>
                                  <span>{formatCurrency(item.paye_tax)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>NHF (2.5%):</span>
                                  <span>
                                    {formatCurrency(item.nhf_deduction)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>NSITF (1%):</span>
                                  <span>
                                    {formatCurrency(item.nsitf_deduction)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Other Deductions:</span>
                                  <span>
                                    {formatCurrency(item.other_deductions)}
                                  </span>
                                </div>
                                <hr />
                                <div className="flex justify-between font-semibold">
                                  <span>Total Deductions:</span>
                                  <span>
                                    {formatCurrency(item.total_deductions)}
                                  </span>
                                </div>
                                <hr />
                                <div className="flex justify-between font-bold text-green-600">
                                  <span>Net Pay:</span>
                                  <span>{formatCurrency(item.net_pay)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}

                {/* Totals Row */}
                <TableRow className="bg-gray-100 font-semibold">
                  <TableCell></TableCell>
                  <TableCell>TOTALS</TableCell>
                  <TableCell>{lineItems.length} employees</TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div>{totals.days_worked}</div>
                      <div className="text-sm">{totals.hours_worked}h</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.gross_pay)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(totals.total_deductions)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-bold">
                    {formatCurrency(totals.net_pay)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineItemsTable;
