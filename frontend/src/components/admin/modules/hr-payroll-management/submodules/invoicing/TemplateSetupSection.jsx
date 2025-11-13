import React, { useState } from "react";
import VisualTemplateBuilder from "../template-builder/VisualTemplateBuilder";

const TemplateSetupSection = ({
  selectedClient,
  selectedGrade,
  setSelectedGrade,
  clientJobStructures,
  collapsedJobStructures,
  setCollapsedJobStructures,
  templateSettings,
  onExcelImport,
}) => {
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);

  const toggleJobStructureCollapse = (structureId) => {
    setCollapsedJobStructures((prev) => ({
      ...prev,
      [structureId]: !prev[structureId],
    }));
  };

  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
  };

  // Show job structures and grade selection if no grade is selected
  if (!selectedGrade) {
    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Job Structures & Pay Grades
        </h4>
        {clientJobStructures && clientJobStructures.length > 0 ? (
          <div className="space-y-2">
            {clientJobStructures.map((jobStructure) => (
              <div
                key={jobStructure.id}
                className="border border-gray-200 rounded-md overflow-hidden"
              >
                {/* Job Structure Header */}
                <div
                  className="bg-gray-50 px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleJobStructureCollapse(jobStructure.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {jobStructure.job_title}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {(jobStructure.payGrades || jobStructure.pay_grades)
                            ?.length || 0}{" "}
                          grades
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        collapsedJobStructures?.[jobStructure.id]
                          ? "rotate-0"
                          : "rotate-180"
                      }`}
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

                {/* Pay Grades Grid */}
                {!collapsedJobStructures?.[jobStructure.id] && (
                  <div className="p-2">
                    {(jobStructure.payGrades || jobStructure.pay_grades)
                      ?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {(
                          jobStructure.payGrades || jobStructure.pay_grades
                        ).map((grade) => {
                          const hasTemplate =
                            templateSettings?.payGradeTemplates?.[grade.id];
                          return (
                            <div
                              key={grade.id}
                              className="border rounded p-2 transition-all cursor-pointer text-sm border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                              onClick={() => handleGradeSelect(grade)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {grade.grade_name}
                                  </div>
                                  {hasTemplate && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 mt-1">
                                      ✓ Template
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 p-2">
                        No pay grades available
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Job Structures Found
            </h3>
            <p className="text-sm text-gray-600">
              Please add job structures for this client first
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Template Builder Card - View imported templates */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">View Template</h3>
              <p className="text-indigo-100 text-sm mb-4">
                View and edit the imported salary calculation template
              </p>
              <p className="text-indigo-200 text-xs">
                Selected Grade:{" "}
                <span className="font-semibold">
                  {selectedGrade.grade_name}
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowVisualBuilder(true)}
              className="mt-4 w-full px-6 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
            >
              View Template
            </button>
          </div>
        </div>

        {/* Excel Import Card */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Import from Excel</h3>
              <p className="text-green-100 text-sm mb-4">
                Upload an Excel template with pre-configured salary components
              </p>
              <p className="text-green-200 text-xs">
                Selected Grade:{" "}
                <span className="font-semibold">
                  {selectedGrade.grade_name}
                </span>
              </p>
            </div>
            <button
              onClick={onExcelImport}
              className="mt-4 w-full px-6 py-3 bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 transition-colors"
            >
              Upload Excel
            </button>
          </div>
        </div>
      </div>

      {/* Back to Grade Selection */}
      <button
        onClick={() => setSelectedGrade(null)}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Grade Selection
      </button>

      {showVisualBuilder && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowVisualBuilder(false)}
                    className="p-2 hover:bg-white/20 rounded-lg"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold">
                      Visual Template Builder
                    </h2>
                    <p className="text-indigo-100 text-sm">
                      {selectedGrade.grade_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVisualBuilder(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <VisualTemplateBuilder
                selectedClient={selectedClient}
                selectedGrade={selectedGrade}
                onClose={() => setShowVisualBuilder(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSetupSection;
