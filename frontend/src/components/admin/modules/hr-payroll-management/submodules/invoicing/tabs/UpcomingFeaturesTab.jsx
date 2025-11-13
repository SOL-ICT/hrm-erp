import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Rocket, Star, Zap, Calendar, Users, TrendingUp } from "lucide-react";

/**
 * Upcoming Features Tab Component
 * Displays planned features and roadmap
 */
const UpcomingFeaturesTab = () => {
  const upcomingFeatures = [
    {
      title: "Phase 2.1: Advanced Invoice Preview",
      description:
        "Review and edit attendance matches before invoice generation with comprehensive validation",
      icon: <Star className="w-6 h-6" />,
      status: "Next Up",
      estimatedDate: "October 3-4, 2025",
      features: [
        "Interactive attendance record editing",
        "Real-time calculation preview",
        "Manual staff addition interface",
        "Validation override capabilities",
      ],
    },
    {
      title: "Phase 2.2: Supplementary Invoice System",
      description:
        "Handle missed staff with automated outstanding invoice tracking",
      icon: <Users className="w-6 h-6" />,
      status: "Planning",
      estimatedDate: "October 5-7, 2025",
      features: [
        "Missed staff detection",
        "Supplementary invoice generation",
        "Outstanding invoice tracking",
        "Automated reminder system",
      ],
    },
    {
      title: "Phase 2.3: Enhanced Template Management",
      description:
        "Advanced salary template configuration with formula builder",
      icon: <Zap className="w-6 h-6" />,
      status: "Design",
      estimatedDate: "October 8-10, 2025",
      features: [
        "Visual formula builder",
        "Template versioning",
        "Bulk template operations",
        "Template validation rules",
      ],
    },
    {
      title: "Phase 3.1: Analytics & Reporting",
      description: "Comprehensive reporting and analytics dashboard",
      icon: <TrendingUp className="w-6 h-6" />,
      status: "Research",
      estimatedDate: "October 11-15, 2025",
      features: [
        "Invoice performance metrics",
        "Client profitability analysis",
        "Template usage statistics",
        "Attendance trend analysis",
      ],
    },
    {
      title: "Phase 3.2: API Integration Hub",
      description: "External system integrations and webhook support",
      icon: <Calendar className="w-6 h-6" />,
      status: "Future",
      estimatedDate: "October 16-19, 2025",
      features: [
        "External payroll system integration",
        "Webhook notifications",
        "API rate limiting",
        "Integration monitoring",
      ],
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      "Next Up": "bg-green-100 text-green-800",
      Planning: "bg-blue-100 text-blue-800",
      Design: "bg-purple-100 text-purple-800",
      Research: "bg-yellow-100 text-yellow-800",
      Future: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-amber-600" />
            Upcoming Features & Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Explore the exciting features coming to the Enhanced Invoicing
            System. Our roadmap focuses on improving efficiency, accuracy, and
            user experience.
          </p>
        </CardContent>
      </Card>

      {/* Current Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎉 Recently Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-green-800">
                Phase 1.3: Enhanced Attendance Upload Process
              </h4>
              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                ✅ Complete
              </span>
            </div>
            <p className="text-green-700 text-sm mb-3">
              Direct pay_grade_structure_id matching with real-time validation
              and template coverage analysis
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-600">
              <div>✅ Template-driven architecture</div>
              <div>✅ Direct ID matching (100% accuracy)</div>
              <div>✅ Real-time validation feedback</div>
              <div>✅ Template coverage analysis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid gap-6">
        {upcomingFeatures.map((feature, index) => (
          <Card key={index} className="border-l-4 border-l-amber-400">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      feature.status
                    )}`}
                  >
                    {feature.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {feature.estimatedDate}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {feature.features.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Development Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Phase 1.3 Complete</span>
              <span className="text-sm text-gray-500">
                Enhanced Upload Process ✅
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Phase 2.1-2.3</span>
              <span className="text-sm text-gray-500">
                October 3-10, 2025 (Advanced Features)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Phase 3.1-3.2</span>
              <span className="text-sm text-gray-500">
                October 11-19, 2025 (Analytics & Integration)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingFeaturesTab;
