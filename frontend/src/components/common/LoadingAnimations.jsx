import React from "react";
import { Card, CardContent, CardHeader } from "../ui";
import {
  Loader2,
  FileSpreadsheet,
  Users,
  Calculator,
  CheckCircle,
} from "lucide-react";

// Basic Loading Spinner
export const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const sizes = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
      <span className="text-gray-600">{text}</span>
    </div>
  );
};

// Skeleton Card for Invoice Lists
export const InvoiceListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Skeleton for Invoice Details
export const InvoiceDetailSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Skeleton */}
      <div className="flex space-x-4 border-b">
        {[1, 2, 3, 4].map((tab) => (
          <div key={tab} className="h-10 w-24 bg-gray-200 rounded-t"></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((card) => (
          <Card key={card}>
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      {/* Table Header */}
      <div className="border rounded-t-lg bg-gray-50 p-4">
        <div className="flex space-x-4">
          {[...Array(columns)].map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="border-l border-r border-b rounded-b-lg">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-b-0 p-4">
            <div className="flex space-x-4">
              {[...Array(columns)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded flex-1"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Processing Animation with Steps
export const ProcessingAnimation = ({
  steps = [],
  currentStep = 0,
  isComplete = false,
  error = null,
}) => {
  const defaultSteps = [
    { label: "Analyzing file", icon: FileSpreadsheet },
    { label: "Processing employees", icon: Users },
    { label: "Calculating totals", icon: Calculator },
    { label: "Generating invoice", icon: CheckCircle },
  ];

  const processSteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              {isComplete ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : error ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="h-8 w-8 text-red-600">✕</div>
                </div>
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              {isComplete
                ? "Processing Complete!"
                : error
                ? "Processing Failed"
                : "Processing Your File"}
            </h3>

            {!isComplete && !error && (
              <p className="text-gray-600 mt-2">
                Please wait while we process your attendance data...
              </p>
            )}
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {processSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep && !isComplete && !error;
              const isDone = index < currentStep || isComplete;
              const isFailed = error && index === currentStep;

              return (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                        ${
                                          isDone
                                            ? "bg-green-100 text-green-600"
                                            : isFailed
                                            ? "bg-red-100 text-red-600"
                                            : isActive
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-400"
                                        }
                                    `}
                  >
                    {isDone ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isFailed ? (
                      <div className="text-xs">✕</div>
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`
                                            text-sm font-medium
                                            ${
                                              isDone
                                                ? "text-green-800"
                                                : isFailed
                                                ? "text-red-800"
                                                : isActive
                                                ? "text-blue-800"
                                                : "text-gray-500"
                                            }
                                        `}
                    >
                      {step.label}
                    </p>

                    {isActive && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full animate-pulse"
                            style={{ width: "60%" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// File Upload Animation
export const FileUploadAnimation = ({ isUploading = false, progress = 0 }) => {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto mb-4 relative">
        {isUploading ? (
          <>
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${
                  50 + (progress / 100) * 50
                }% 0%, ${50 + (progress / 100) * 50}% 100%, 50% 100%)`,
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            </div>
          </>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isUploading ? "Uploading File..." : "Ready to Upload"}
      </h3>

      {isUploading && (
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Floating Action Button with Loading
export const LoadingButton = ({
  loading = false,
  children,
  loadingText = "Processing...",
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
                relative inline-flex items-center justify-center
                ${loading ? "cursor-not-allowed opacity-75" : ""}
                ${props.className || ""}
            `}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {loading ? loadingText : children}
    </button>
  );
};

// Success Animation
export const SuccessAnimation = ({ message = "Success!" }) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600 animate-bounce" />
      </div>
      <h3 className="text-lg font-semibold text-green-800">{message}</h3>
    </div>
  );
};

export default {
  LoadingSpinner,
  InvoiceListSkeleton,
  InvoiceDetailSkeleton,
  TableSkeleton,
  ProcessingAnimation,
  FileUploadAnimation,
  LoadingButton,
  SuccessAnimation,
};
