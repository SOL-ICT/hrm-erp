import React, { useState } from "react";
import {
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
} from "@/components/ui";
import {
  AlertTriangle,
  XCircle,
  User,
  Search,
  CheckCircle,
  Edit,
} from "lucide-react";
import PayGradeStructureSelector from "../selectors/PayGradeStructureSelector";

/**
 * Phase 2.1: Unmatched Staff Table Component
 * Displays unmatched staff with resolution options
 */
const UnmatchedStaffTable = ({
  unmatchedStaff = [],
  onStaffUpdate,
  clientId,
}) => {
  const [resolvingStaff, setResolvingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getUnmatchedReason = (staff) => {
    if (!staff.pay_grade_structure_id) {
      return {
        reason: "Missing Pay Grade",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-4 h-4" />,
        description: "No pay grade structure ID provided",
      };
    }

    if (staff.validation_errors?.includes("invalid_pay_grade")) {
      return {
        reason: "Invalid Pay Grade",
        color: "bg-orange-100 text-orange-800",
        icon: <AlertTriangle className="w-4 h-4" />,
        description: "Pay grade structure ID not found in system",
      };
    }

    if (staff.validation_errors?.includes("no_template")) {
      return {
        reason: "No Template",
        color: "bg-yellow-100 text-yellow-800",
        icon: <AlertTriangle className="w-4 h-4" />,
        description: "No invoice template found for this pay grade",
      };
    }

    return {
      reason: "Unknown Issue",
      color: "bg-gray-100 text-gray-800",
      icon: <AlertTriangle className="w-4 h-4" />,
      description: "Unable to determine matching issue",
    };
  };

  const handleResolveStaff = (staff) => {
    setResolvingStaff(staff);
  };

  const handleSaveResolution = async () => {
    if (!resolvingStaff) return;

    const form =
      document.querySelector('[id="resolve_employee_code"]').closest("form") ||
      document;
    const updatedData = {
      employee_code: form.querySelector("#resolve_employee_code").value,
      employee_name: form.querySelector("#resolve_employee_name").value,
      days_worked: parseInt(form.querySelector("#resolve_days_worked").value),
      pay_grade_structure_id:
        resolvingStaff._selectedPayGrade ||
        resolvingStaff.pay_grade_structure_id,
      resolution_method: "manual_correction",
    };

    if (onStaffUpdate) {
      await onStaffUpdate(resolvingStaff.id, updatedData);
    }
    setResolvingStaff(null);
  };

  const filteredStaff = unmatchedStaff.filter(
    (staff) =>
      staff.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!unmatchedStaff || unmatchedStaff.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          All Staff Matched Successfully
        </h3>
        <p className="text-gray-600">
          Every staff member from the uploaded attendance data has been
          successfully matched.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            Unmatched Staff ({unmatchedStaff.length})
          </h3>
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Requires Resolution
          </Badge>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Alert for unmatched staff */}
      {unmatchedStaff.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {unmatchedStaff.length} staff member(s) could not be automatically
            matched. Please review and resolve the issues below before
            proceeding to invoice generation.
          </AlertDescription>
        </Alert>
      )}

      {/* Staff Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Employee</TableHead>
              <TableHead>Pay Grade ID</TableHead>
              <TableHead>Days Worked</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((staff) => {
              const issue = getUnmatchedReason(staff);

              return (
                <TableRow key={staff.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {staff.employee_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {staff.employee_code || "N/A"}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {staff.pay_grade_structure_id || "Not provided"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{staff.days_worked || 0}</div>
                  </TableCell>

                  <TableCell>
                    <Badge className={issue.color}>
                      {issue.icon}
                      <span className="ml-1">{issue.reason}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {issue.description}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveStaff(staff)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Resolution Modal */}
      {resolvingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">
              Resolve Staff Issue: {resolvingStaff.employee_name || "Unknown"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  defaultValue={resolvingStaff.employee_code || ""}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  id="resolve_employee_code"
                  placeholder="Enter employee code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  defaultValue={resolvingStaff.employee_name || ""}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  id="resolve_employee_name"
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Worked
                </label>
                <input
                  type="number"
                  defaultValue={resolvingStaff.days_worked || 0}
                  min="0"
                  max="31"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  id="resolve_days_worked"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Grade Structure
                </label>
                <PayGradeStructureSelector
                  defaultValue={resolvingStaff.pay_grade_structure_id}
                  clientId={clientId}
                  onSelect={(payGradeId) => {
                    resolvingStaff._selectedPayGrade = payGradeId;
                  }}
                  showTemplateStatus={true}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setResolvingStaff(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveResolution}
                className="bg-green-600 hover:bg-green-700"
              >
                Resolve & Match
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnmatchedStaffTable;
