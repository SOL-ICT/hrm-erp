"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  User,
  Building,
  Mail,
  FileText,
  Save,
  Trash2,
  List,
  ArrowLeft,
  Upload,
  CheckCircle,
  XCircle,
  PlusCircle,
} from "lucide-react";

// Pre-populated mock data for the employee and their requests
const employeeData = {
  employeeCode: "SOL/2023/0298",
  clientName: "Strategic Outsourcing Limited",
  serviceLocation: "LAGOS",
  formalName: "Ibrahim Babajide Runmonkun",
  designation: "Officer",
  emailId: "bdam81@gmail.com",
  solRmEmailId: "elimreports@solnigeria.com",
};

// Mock API call to simulate fetching requests from a backend
const fetchRequests = () => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock data for the user's name change requests
      const mockRequests = [
        {
          id: 1,
          firstName: "Ibrahim",
          middleName: "Babajide",
          lastName: "Runmonkun",
          reason: "Original name",
          status: "Approved",
          submissionDate: "2024-01-15",
        },
        // Uncomment this to test the 'Pending' state
        // {
        //   id: 2,
        //   firstName: "Ibrahim",
        //   middleName: "David",
        //   lastName: "Babajide",
        //   reason: "Typographical error correction",
        //   status: "Pending",
        //   submissionDate: "2024-08-20",
        // },
        // Uncomment this to test the 'Rejected' state
        // {
        //   id: 3,
        //   firstName: "Ibrahim",
        //   middleName: "David",
        //   lastName: "Smith",
        //   reason: "Changed my mind",
        //   status: "Rejected",
        //   submissionDate: "2024-07-10",
        //   rejectionReason: "Reason for change was not valid.",
        // },
      ];
      resolve(mockRequests);
    }, 500); // Simulate network delay
  });
};

export default function NameChange() {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    reasonForChange: "",
    proofOfReason: null,
  });
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const getRequests = async () => {
      setLoading(true);
      const data = await fetchRequests();
      setRequests(data);
      setLoading(false);
    };
    getRequests();
  }, [isRequestSubmitted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, proofOfReason: file }));
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    console.log("Submitting form:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsRequestSubmitted(true);
    setShowForm(false);
    // Reset form fields
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      reasonForChange: "",
      proofOfReason: null,
    });
    setFileName("");
    alert("Name change request submitted successfully!");
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
          {/* Action Buttons, could be for admins or if the user has a request */}
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
                  Request Status: <span className={`font-bold ${
                    request.status === "Approved" ? "text-green-600" :
                    request.status === "Pending" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>{request.status}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Submitted on: {request.submissionDate}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Proposed Name: {request.firstName} {request.middleName} {request.lastName}
                </p>
                <p className="text-sm text-gray-700">
                  Reason: {request.reason}
                </p>
                {request.status === "Rejected" && (
                  <p className="mt-2 text-sm font-semibold text-red-500">
                    Rejection Reason: {request.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Submit New Name Change Request
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new first name"
                  required
                />
              </div>
              <div>
                <label htmlFor="middleName" className="text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new middle name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new last name"
                  required
                />
              </div>
              <div>
                <label htmlFor="reasonForChange" className="text-sm font-medium text-gray-700">
                  Reason for change
                </label>
                <textarea
                  id="reasonForChange"
                  name="reasonForChange"
                  value={formData.reasonForChange}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Briefly explain the reason for the name change"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <label className="text-sm font-medium text-gray-700">Proof of reason</label>
              <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-full bg-gray-50">
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drag & drop a file here, or
                </p>
                <label htmlFor="file-upload" className="mt-1 cursor-pointer font-semibold text-blue-600 hover:text-blue-500">
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
                    File selected: <span className="font-medium text-gray-700">{fileName}</span>
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