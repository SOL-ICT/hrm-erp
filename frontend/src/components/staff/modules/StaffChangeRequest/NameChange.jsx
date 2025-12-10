"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Save,
  ArrowLeft,
  Upload,
  CheckCircle,
  XCircle,
  PlusCircle,
} from "lucide-react";

// Example employee data (static for now)
const employeeData = {
  employeeCode: "SOL/2023/0298",
  clientName: "Strategic Outsourcing Limited",
  serviceLocation: "LAGOS",
  formalName: "Ibrahim Babajide Runmonkun",
  designation: "Officer",
  emailId: "bdam81@gmail.com",
};

export default function NameChange() {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    reasonForChange: "",
    proofOfReason: null,
  });
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch("http://localhost:8000/api/staff/name-change-requests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setErrorMessage("Unable to load requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [isSubmitting]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, proofOfReason: file }));
      setFileName(file.name);
    }
  };

  // Submit new request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = new FormData();
      payload.append("first_name", formData.firstName);
      payload.append("middle_name", formData.middleName);
      payload.append("last_name", formData.lastName);
      payload.append("reason", formData.reasonForChange);
      payload.append("proof_document", formData.proofOfReason);

      const response = await fetch("http://localhost:8000/api/staff/name-change-requests", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      await response.json();
      alert("Name change request submitted successfully!");

      // Reset form
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        reasonForChange: "",
        proofOfReason: null,
      });
      setFileName("");
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      setErrorMessage("Failed to submit request. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPendingRequest = requests.some((req) => req.status === "Pending");
  const hasRejectedRequest = requests.some((req) => req.status === "Rejected");

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Name Change Application
        </h1>
        <div className="flex space-x-2">
          {!showForm && hasRejectedRequest && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Resubmit Request</span>
            </button>
          )}
          {!showForm && !hasPendingRequest && !hasRejectedRequest && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Request Name Change</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Employee Code</label>
          <input
            type="text"
            value={employeeData.employeeCode}
            readOnly
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Formal Name</label>
          <input
            type="text"
            value={employeeData.formalName}
            readOnly
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Designation</label>
          <input
            type="text"
            value={employeeData.designation}
            readOnly
            className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 text-red-600 font-semibold">{errorMessage}</div>
      )}

      {/* Requests list OR form */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          <p>Loading request history...</p>
        </div>
      ) : requests.length > 0 && !showForm ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Request History</h2>
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex items-start space-x-4"
            >
              <div className="flex-shrink-0">
                {request.status === "Approved" && (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                )}
                {request.status === "Pending" && (
                  <Mail className="h-8 w-8 text-yellow-500" />
                )}
                {request.status === "Rejected" && (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-lg text-gray-900">
                  Request Status:{" "}
                  <span
                    className={`font-bold ${
                      request.status === "Approved"
                        ? "text-green-600"
                        : request.status === "Pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {request.status}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Submitted on:{" "}
                  {new Date(request.submitted_at).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Proposed Name: {request.first_name} {request.middle_name}{" "}
                  {request.last_name}
                </p>
                <p className="text-sm text-gray-700">Reason: {request.reason}</p>
                {request.status === "Rejected" && (
                  <p className="mt-2 text-sm font-semibold text-red-500">
                    Rejection Reason: {request.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Submit form
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Submit New Name Change Request
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  name="reasonForChange"
                  value={formData.reasonForChange}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Proof of reason
              </label>
              <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-full bg-gray-50">
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag & drop a file here, or
                </p>
                <label
                  htmlFor="file-upload"
                  className="mt-1 cursor-pointer font-semibold text-blue-600 hover:text-blue-500"
                >
                  Choose File
                  <input
                    id="file-upload"
                    name="proofOfReason"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    required
                  />
                </label>
                {fileName && (
                  <p className="mt-2 text-sm text-gray-500">
                    File selected:{" "}
                    <span className="font-medium text-gray-700">{fileName}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow-sm hover:bg-gray-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <Save className="h-5 w-5" />
              <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
