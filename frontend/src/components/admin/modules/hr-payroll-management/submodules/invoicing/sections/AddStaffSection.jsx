import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Badge,
} from "@/components/ui";
import {
  Plus,
  Search,
  User,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import PayGradeStructureSelector from "../selectors/PayGradeStructureSelector";

/**
 * Phase 2.1: Add Staff Section Component
 * Manual staff addition with client staff search
 */
const AddStaffSection = ({ clientId, onAddStaff, existingStaff = [] }) => {
  const [clientStaff, setClientStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [manualEntry, setManualEntry] = useState({
    employee_code: "",
    employee_name: "",
    pay_grade_structure_id: "",
    days_worked: 0,
    addition_reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClientStaff();
    }
  }, [clientId]);

  const loadClientStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/staff/client/${clientId}`);

      if (!response.ok) {
        throw new Error("Failed to load client staff");
      }

      const data = await response.json();
      setClientStaff(data.staff || []);
    } catch (error) {
      console.error("Error loading client staff:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isStaffAlreadyAdded = (staffCode) => {
    return existingStaff.some(
      (existing) => existing.employee_code === staffCode
    );
  };

  const filteredStaff = clientStaff.filter((staff) => {
    const matchesSearch =
      staff.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const notAlreadyAdded = !isStaffAlreadyAdded(staff.employee_code);

    return matchesSearch && notAlreadyAdded;
  });

  const handleStaffSelection = (staff) => {
    setSelectedStaff((prev) => {
      const isSelected = prev.some((s) => s.id === staff.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== staff.id);
      } else {
        return [...prev, staff];
      }
    });
  };

  const handleBulkAdd = async () => {
    if (selectedStaff.length === 0) {
      alert("Please select staff members to add");
      return;
    }

    const daysWorked = prompt("Enter days worked for all selected staff:", "0");
    if (!daysWorked || isNaN(daysWorked)) {
      alert("Please enter a valid number of days worked");
      return;
    }

    const reason = prompt("Enter reason for adding these staff members:");
    if (!reason) {
      alert("Please provide a reason for adding these staff members");
      return;
    }

    try {
      for (const staff of selectedStaff) {
        const staffData = {
          employee_code: staff.employee_code,
          employee_name: staff.employee_name,
          pay_grade_structure_id: staff.pay_grade_structure_id,
          days_worked: parseInt(daysWorked),
          addition_method: "manual",
          addition_reason: reason,
        };

        await onAddStaff(staffData);
      }

      setSelectedStaff([]);
      alert(`Successfully added ${selectedStaff.length} staff members`);
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Failed to add some staff members");
    }
  };

  const handleManualAdd = async () => {
    if (!manualEntry.employee_code || !manualEntry.employee_name) {
      alert("Please fill in employee code and name");
      return;
    }

    if (!manualEntry.pay_grade_structure_id) {
      alert("Please select a pay grade structure");
      return;
    }

    try {
      await onAddStaff({
        ...manualEntry,
        days_worked: parseInt(manualEntry.days_worked),
        addition_method: "manual",
      });

      // Reset form
      setManualEntry({
        employee_code: "",
        employee_name: "",
        pay_grade_structure_id: "",
        days_worked: 0,
        addition_reason: "",
      });
      setShowManualForm(false);
      alert("Staff member added successfully");
    } catch (error) {
      console.error("Error adding manual staff:", error);
      alert("Failed to add staff member");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Add Missing Staff
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Add staff members who were missed in the uploaded attendance data
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowManualForm(!showManualForm)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </Button>

          {selectedStaff.length > 0 && (
            <Button
              onClick={handleBulkAdd}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Selected ({selectedStaff.length})
            </Button>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      {showManualForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Manual Staff Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code *
                </label>
                <input
                  type="text"
                  value={manualEntry.employee_code}
                  onChange={(e) =>
                    setManualEntry({
                      ...manualEntry,
                      employee_code: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter employee code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  value={manualEntry.employee_name}
                  onChange={(e) =>
                    setManualEntry({
                      ...manualEntry,
                      employee_name: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Worked
                </label>
                <input
                  type="number"
                  value={manualEntry.days_worked}
                  onChange={(e) =>
                    setManualEntry({
                      ...manualEntry,
                      days_worked: e.target.value,
                    })
                  }
                  min="0"
                  max="31"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Grade Structure *
                </label>
                <PayGradeStructureSelector
                  clientId={clientId}
                  onSelect={(payGradeId) =>
                    setManualEntry({
                      ...manualEntry,
                      pay_grade_structure_id: payGradeId,
                    })
                  }
                  showTemplateStatus={true}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Addition
              </label>
              <textarea
                value={manualEntry.addition_reason}
                onChange={(e) =>
                  setManualEntry({
                    ...manualEntry,
                    addition_reason: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows="2"
                placeholder="Explain why this staff member is being added manually"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowManualForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleManualAdd}>Add Staff Member</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Staff Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Client Staff Database ({filteredStaff.length} available)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading client staff...</p>
            </div>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error loading client staff: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Staff List */}
          {!loading && !error && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm
                    ? "No staff found matching your search"
                    : "No additional staff available to add"}
                </div>
              ) : (
                filteredStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedStaff.some((s) => s.id === staff.id)
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => handleStaffSelection(staff)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {staff.employee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {staff.employee_code} | Pay Grade:{" "}
                          {staff.pay_grade_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {staff.has_template ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Template Available
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            No Template
                          </Badge>
                        )}

                        {selectedStaff.some((s) => s.id === staff.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStaffSection;
