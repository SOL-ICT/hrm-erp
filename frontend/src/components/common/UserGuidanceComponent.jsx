import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui";
import {
  HelpCircle,
  BookOpen,
  Play,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  FileUpload,
  Eye,
  Download,
  Users,
  Calculator,
  FileSpreadsheet,
} from "lucide-react";

const UserGuidanceComponent = () => {
  const [currentTour, setCurrentTour] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Tour configurations
  const tours = {
    quickStart: {
      title: "Quick Start Guide",
      description: "Get up and running in 5 minutes",
      steps: [
        {
          title: "Welcome to HRM Invoice System",
          content:
            "This system helps you process employee attendance data and generate accurate invoices for clients.",
          action: "Get Started",
          icon: <Users className="h-6 w-6" />,
        },
        {
          title: "Upload Attendance Data",
          content:
            "Start by uploading your employee attendance files. We support Excel and CSV formats.",
          action: "Learn More",
          icon: <FileUpload className="h-6 w-6" />,
        },
        {
          title: "Review Processing Results",
          content:
            "Our system automatically processes your data and shows detailed breakdowns of calculations.",
          action: "Continue",
          icon: <Calculator className="h-6 w-6" />,
        },
        {
          title: "Generate Client Invoices",
          content:
            "Create professional invoices for your clients with detailed employee breakdowns.",
          action: "Finish",
          icon: <FileSpreadsheet className="h-6 w-6" />,
        },
      ],
    },
    fileUpload: {
      title: "File Upload Guide",
      description: "Learn how to properly upload and format your files",
      steps: [
        {
          title: "Download Templates",
          content:
            "Start by downloading our template files to ensure your data is formatted correctly.",
          action: "Next",
          icon: <Download className="h-6 w-6" />,
        },
        {
          title: "Fill Your Data",
          content:
            "Replace the sample data with your actual employee attendance information.",
          action: "Next",
          icon: <Users className="h-6 w-6" />,
        },
        {
          title: "Upload & Validate",
          content:
            "Upload your file and review the validation results before processing.",
          action: "Next",
          icon: <FileUpload className="h-6 w-6" />,
        },
        {
          title: "Process Successfully",
          content:
            "Once validation passes, your file will be processed and invoices generated.",
          action: "Finish",
          icon: <CheckCircle className="h-6 w-6" />,
        },
      ],
    },
  };

  const faqs = [
    {
      question: "What file formats are supported?",
      answer:
        "We support Excel (.xlsx, .xls) and CSV (.csv) files. For best results, use our provided templates.",
      category: "Files",
    },
    {
      question: "How are invoice totals calculated?",
      answer:
        "Invoice totals are calculated based on employee basic salaries, allowances, working days, and any applicable deductions. The system uses the rates and formulas configured for each client.",
      category: "Calculations",
    },
    {
      question: "Can I edit invoices after they're generated?",
      answer:
        "Yes, you can review and make adjustments to invoices before finalizing them. Use the invoice detail view to make changes.",
      category: "Invoices",
    },
    {
      question: "What happens if my file has errors?",
      answer:
        "The system will show you a detailed validation report highlighting any errors. You can fix the issues and re-upload your file.",
      category: "Errors",
    },
    {
      question: "How do I handle missing employee data?",
      answer:
        "If employee data is missing, the system will flag it during validation. You can either add the missing information or exclude those records from processing.",
      category: "Data",
    },
    {
      question: "Can I process multiple files at once?",
      answer:
        "Yes, you can use the batch upload feature to process multiple files simultaneously. This is useful for handling data from multiple locations or time periods.",
      category: "Batch Processing",
    },
  ];

  const quickActions = [
    {
      title: "Upload New File",
      description: "Process employee attendance data",
      icon: <FileUpload className="h-5 w-5" />,
      action: "Go to Upload",
      color: "bg-blue-500",
    },
    {
      title: "View Invoices",
      description: "Check generated invoices",
      icon: <Eye className="h-5 w-5" />,
      action: "View Dashboard",
      color: "bg-green-500",
    },
    {
      title: "Download Templates",
      description: "Get formatting templates",
      icon: <Download className="h-5 w-5" />,
      action: "Get Templates",
      color: "bg-purple-500",
    },
  ];

  const startTour = (tourKey) => {
    setCurrentTour(tourKey);
    setCurrentStep(0);
  };

  const nextStep = () => {
    const tour = tours[currentTour];
    if (currentStep < tour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentTour(null);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const TourModal = () => {
    if (!currentTour) return null;

    const tour = tours[currentTour];
    const step = tour.steps[currentStep];

    return (
      <Dialog open={!!currentTour} onOpenChange={() => setCurrentTour(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {step.icon}
              <span className="ml-2">{step.title}</span>
            </DialogTitle>
            <DialogDescription>
              Step {currentStep + 1} of {tour.steps.length}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600">{step.content}</p>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / tour.steps.length) * 100}%`,
                }}
              ></div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button onClick={nextStep}>
                {currentStep === tour.steps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <BookOpen className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>New to the system? Take our quick tour to get started!</span>
          <Button size="sm" onClick={() => startTour("quickStart")}>
            <Play className="h-4 w-4 mr-2" />
            Start Tour
          </Button>
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className={`${action.color} text-white p-2 rounded-lg`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {action.description}
                    </p>
                    <Button size="sm" variant="outline">
                      {action.action}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guided Tours */}
      <Card>
        <CardHeader>
          <CardTitle>Guided Tours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tours).map(([key, tour]) => (
              <div key={key} className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{tour.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{tour.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{tour.steps.length} steps</Badge>
                  <Button size="sm" onClick={() => startTour(key)}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Tour
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {faq.category}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                  </div>
                </summary>
                <div className="mt-2 p-4 border-t bg-gray-50 rounded-b-lg">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to
              help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline">Contact Support</Button>
              <Button variant="outline">View Documentation</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TourModal />
    </div>
  );
};

export default UserGuidanceComponent;
