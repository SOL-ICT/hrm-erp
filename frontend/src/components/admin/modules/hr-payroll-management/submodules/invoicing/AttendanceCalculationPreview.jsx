import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Clock,
  BarChart3,
  Info,
  AlertCircle,
  Table as TableIcon,
} from "lucide-react";

/**
 * Phase 4.2 Frontend Integration Component
 * Shows real-time attendance-based payroll calculation preview
 */
const AttendanceCalculationPreview = ({
  attendanceData,
  clientId,
  payCalculationBasis = "working_days",
  onCalculationUpdate,
}) => {
  const [calculations, setCalculations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("current");

  // Simulate different attendance scenarios
  const scenarios = {
    current: { name: "Current Attendance", factor: 1.0 },
    full_month: { name: "Full Month", factor: 1.0 },
    partial_75: { name: "75% Attendance", factor: 0.75 },
    partial_50: { name: "50% Attendance", factor: 0.5 },
  };

  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      calculatePreview();
    }
  }, [attendanceData, clientId, payCalculationBasis, selectedScenario]);

  const calculatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate attendance-based payroll calculations
      const previewCalculations = attendanceData.map((record, index) => {
        const daysWorked = Math.round(
          record.days_worked * scenarios[selectedScenario].factor
        );
        const totalDays = payCalculationBasis === "working_days" ? 22 : 30;
        const attendanceFactor = Math.min(daysWorked / totalDays, 1.0);

        // Simulate salary data (in real implementation, this would come from API)
        const baseSalary = 300000; // Default base salary
        const grossSalary = baseSalary * attendanceFactor;

        // Simulate statutory deductions
        const paye = grossSalary * 0.075; // 7.5%
        const pension = grossSalary * 0.08; // 8%
        const nsitf = grossSalary * 0.01; // 1%

        const totalDeductions = paye + pension + nsitf;
        const netSalary = grossSalary - totalDeductions;
        const creditToBank = netSalary * 1.15; // Add management fee simulation

        return {
          id: index + 1,
          employee_name: record.employee_name || `Employee ${index + 1}`,
          employee_code:
            record.employee_code || `EMP${String(index + 1).padStart(3, "0")}`,
          designation: record.designation || "Staff",
          days_worked: daysWorked,
          total_days: totalDays,
          attendance_factor: attendanceFactor,
          attendance_percentage: (attendanceFactor * 100).toFixed(1),
          base_salary: baseSalary,
          gross_salary: grossSalary,
          statutory_deductions: {
            paye,
            pension,
            nsitf,
            total: totalDeductions,
          },
          net_salary: netSalary,
          credit_to_bank: creditToBank,
          calculation_basis: payCalculationBasis,
        };
      });

      setCalculations(previewCalculations);

      // Calculate summary
      const totalEmployees = previewCalculations.length;
      const totalGross = previewCalculations.reduce(
        (sum, calc) => sum + calc.gross_salary,
        0
      );
      const totalNet = previewCalculations.reduce(
        (sum, calc) => sum + calc.net_salary,
        0
      );
      const totalCreditToBank = previewCalculations.reduce(
        (sum, calc) => sum + calc.credit_to_bank,
        0
      );
      const avgAttendance =
        previewCalculations.reduce(
          (sum, calc) => sum + calc.attendance_factor,
          0
        ) / totalEmployees;

      setSummary({
        total_employees: totalEmployees,
        total_gross: totalGross,
        total_net: totalNet,
        total_credit_to_bank: totalCreditToBank,
        average_attendance: avgAttendance,
        calculation_basis: payCalculationBasis,
      });

      // Notify parent component
      if (onCalculationUpdate) {
        onCalculationUpdate({
          calculations: previewCalculations,
          summary: {
            total_employees: totalEmployees,
            total_gross: totalGross,
            total_net: totalNet,
            total_credit_to_bank: totalCreditToBank,
            average_attendance: avgAttendance,
          },
        });
      }
    } catch (err) {
      setError("Failed to calculate attendance preview: " + err.message);
      console.error("Calculation preview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 75) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 50) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Attendance Calculation Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Upload attendance data to see calculation preview
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Scenario Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Attendance-Based Payroll Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {payCalculationBasis === "working_days"
                  ? "Working Days"
                  : "Calendar Days"}
              </Badge>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {Object.entries(scenarios).map(([key, scenario]) => (
                  <option key={key} value={key}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        {/* Summary Cards */}
        {summary && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Employees
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {summary.total_employees}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Gross Payroll
                  </span>
                </div>
                <div className="text-lg font-bold text-green-800">
                  {formatCurrency(summary.total_gross)}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">
                    Net Payroll
                  </span>
                </div>
                <div className="text-lg font-bold text-purple-800">
                  {formatCurrency(summary.total_net)}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    Avg Attendance
                  </span>
                </div>
                <div className="text-xl font-bold text-orange-800">
                  {(summary.average_attendance * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detailed Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Detailed Calculation Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Calculating...</span>
            </div>
          ) : error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary View</TabsTrigger>
                <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                <TabsTrigger value="deductions">Deductions</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Days Worked</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Gross Salary</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Credit to Bank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculations.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {calc.employee_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {calc.employee_code}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {calc.days_worked}/{calc.total_days}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getAttendanceColor(
                                calc.attendance_percentage
                              )}
                            >
                              {calc.attendance_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(calc.gross_salary)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(calc.net_salary)}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(calc.credit_to_bank)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Base Salary</TableHead>
                        <TableHead>Attendance Factor</TableHead>
                        <TableHead>Adjusted Gross</TableHead>
                        <TableHead>Total Deductions</TableHead>
                        <TableHead>Final Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculations.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {calc.employee_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {calc.designation}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(calc.base_salary)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {calc.attendance_factor.toFixed(4)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(calc.gross_salary)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{formatCurrency(calc.statutory_deductions.total)}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(calc.net_salary)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="deductions" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>PAYE (7.5%)</TableHead>
                        <TableHead>Pension (8%)</TableHead>
                        <TableHead>NSITF (1%)</TableHead>
                        <TableHead>Total Deductions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculations.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>
                            <div className="font-medium">
                              {calc.employee_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(calc.statutory_deductions.paye)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(calc.statutory_deductions.pension)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(calc.statutory_deductions.nsitf)}
                          </TableCell>
                          <TableCell className="font-bold text-red-600">
                            {formatCurrency(calc.statutory_deductions.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Calculation Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Calculation Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>Calculation Method:</strong>{" "}
                {payCalculationBasis === "working_days"
                  ? "Working Days (Mon-Fri)"
                  : "Calendar Days (All days)"}
                <br />
                <span className="text-sm text-gray-600">
                  {payCalculationBasis === "working_days"
                    ? "Salary is prorated based on 22 working days per month"
                    : "Salary is prorated based on 30 calendar days per month"}
                </span>
              </AlertDescription>
            </Alert>

            <Alert>
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                <strong>Scenario:</strong> {scenarios[selectedScenario].name}
                <br />
                <span className="text-sm text-gray-600">
                  Current simulation shows{" "}
                  {scenarios[selectedScenario].factor * 100}% of original
                  attendance data
                </span>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalculationPreview;
