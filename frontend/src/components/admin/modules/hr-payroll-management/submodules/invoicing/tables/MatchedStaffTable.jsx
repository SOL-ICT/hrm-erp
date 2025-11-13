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
} from "@/components/ui";
import {
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  User,
  Target,
  Calculator,
} from "lucide-react";
import PayGradeStructureSelector from "../selectors/PayGradeStructureSelector";

/**
 * Phase 2.1: Matched Staff Table Component
 * Displays successfully matched staff with confidence indicators
 * and editing capabilities
 */
const MatchedStaffTable = ({
  matchedStaff = [],
  onStaffUpdate,
  onStaffRemoval,
  templateCoverage = {},
}) => {
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState([]);

  const getConfidenceIndicator = (confidence) => {
    if (confidence >= 95) {
      return {
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "High",
      };
    } else if (confidence >= 80) {
      return {
        color: "bg-yellow-100 text-yellow-800",
        icon: <AlertTriangle className="w-4 h-4" />,
        label: "Medium",
      };
    } else {
      return {
        color: "bg-red-100 text-red-800",
        icon: <AlertTriangle className="w-4 h-4" />,
        label: "Low",
      };
    }
  };

  const getTemplateStatus = (payGradeStructureId) => {
    const hasTemplate = templateCoverage?.covered_pay_grades?.includes(
      parseInt(payGradeStructureId)
    );

    return {
      hasTemplate,
      color: hasTemplate
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800",
      label: hasTemplate ? "Template Available" : "No Template",
    };
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
  };

  const handleSaveEdit = async (updatedData) => {
    if (onStaffUpdate) {
      await onStaffUpdate(editingStaff.id, updatedData);
    }
    setEditingStaff(null);
  };

  const handleBulkSelection = (staffId) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    setSelectedStaff(
      selectedStaff.length === matchedStaff.length
        ? []
        : matchedStaff.map((staff) => staff.id)
    );
  };

  if (!matchedStaff || matchedStaff.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Matched Staff
        </h3>
        <p className="text-gray-600">
          No staff members were successfully matched from the uploaded
          attendance data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            Matched Staff ({matchedStaff.length})
          </h3>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Successfully Matched
          </Badge>
        </div>

        {selectedStaff.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedStaff.length} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Handle bulk operations
                console.log("Bulk edit for:", selectedStaff);
              }}
            >
              Bulk Edit
            </Button>
          </div>
        )}
      </div>

      {/* Staff Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedStaff.length === matchedStaff.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Pay Grade</TableHead>
              <TableHead>Days Worked</TableHead>
              <TableHead>Match Confidence</TableHead>
              <TableHead>Template Status</TableHead>
              <TableHead>Estimated Amount</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matchedStaff.map((staff) => {
              const confidence = getConfidenceIndicator(
                staff.match_confidence || 100
              );
              const templateStatus = getTemplateStatus(
                staff.pay_grade_structure_id
              );

              return (
                <TableRow key={staff.id} className="hover:bg-gray-50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(staff.id)}
                      onChange={() => handleBulkSelection(staff.id)}
                      className="rounded"
                    />
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {staff.employee_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {staff.employee_code}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {staff.pay_grade_name ||
                          `Grade ${staff.pay_grade_structure_id}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {staff.pay_grade_structure_id}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{staff.days_worked}</div>
                  </TableCell>

                  <TableCell>
                    <Badge className={confidence.color}>
                      {confidence.icon}
                      <span className="ml-1">{confidence.label}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={templateStatus.color}>
                      {templateStatus.label}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-green-600">
                      {staff.estimated_amount
                        ? `₦${staff.estimated_amount.toLocaleString()}`
                        : "Calculating..."}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStaff(staff)}
                        className="p-1 h-8 w-8"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStaffRemoval(staff.id)}
                        className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">
              Edit Staff: {editingStaff.employee_name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  defaultValue={editingStaff.employee_code}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  id="employee_code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  defaultValue={editingStaff.employee_name}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  id="employee_name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Worked
                </label>
                <input
                  type="number"
                  defaultValue={editingStaff.days_worked}
                  min="0"
                  max="31"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  id="days_worked"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Grade Structure
                </label>
                <PayGradeStructureSelector
                  defaultValue={editingStaff.pay_grade_structure_id}
                  clientId={editingStaff.client_id}
                  onSelect={(payGradeId) => {
                    // Store selected pay grade
                    editingStaff._selectedPayGrade = payGradeId;
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingStaff(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const form =
                    document
                      .querySelector('[id="employee_code"]')
                      .closest("form") || document;
                  const updatedData = {
                    employee_code: form.querySelector("#employee_code").value,
                    employee_name: form.querySelector("#employee_name").value,
                    days_worked: parseInt(
                      form.querySelector("#days_worked").value
                    ),
                    pay_grade_structure_id:
                      editingStaff._selectedPayGrade ||
                      editingStaff.pay_grade_structure_id,
                  };
                  handleSaveEdit(updatedData);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchedStaffTable;
