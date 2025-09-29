import React from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui";
import {
  AlertCircle,
  RefreshCw,
  Home,
  FileX,
  Wifi,
  Server,
  Bug,
  ExternalLink,
} from "lucide-react";

const ErrorBoundaryComponent = ({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  showDetails = false,
}) => {
  const getErrorType = (error) => {
    if (error.name === "NetworkError" || error.message.includes("fetch")) {
      return "network";
    } else if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk")
    ) {
      return "chunk";
    } else if (error.message.includes("Permission") || error.status === 403) {
      return "permission";
    } else if (error.status >= 500) {
      return "server";
    } else {
      return "client";
    }
  };

  const errorType = getErrorType(error);

  const errorMessages = {
    network: {
      title: "Connection Problem",
      description:
        "Unable to connect to the server. Please check your internet connection and try again.",
      icon: <Wifi className="h-5 w-5" />,
      color: "border-orange-200 bg-orange-50",
      iconColor: "text-orange-600",
    },
    server: {
      title: "Server Error",
      description:
        "Something went wrong on our servers. Our team has been notified and is working on a fix.",
      icon: <Server className="h-5 w-5" />,
      color: "border-red-200 bg-red-50",
      iconColor: "text-red-600",
    },
    permission: {
      title: "Access Denied",
      description:
        "You don't have permission to access this resource. Please contact your administrator.",
      icon: <FileX className="h-5 w-5" />,
      color: "border-yellow-200 bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    chunk: {
      title: "Loading Error",
      description:
        "There was a problem loading part of the application. Please refresh the page.",
      icon: <RefreshCw className="h-5 w-5" />,
      color: "border-blue-200 bg-blue-50",
      iconColor: "text-blue-600",
    },
    client: {
      title: "Something Went Wrong",
      description:
        "An unexpected error occurred. Please try again or contact support if the problem persists.",
      icon: <Bug className="h-5 w-5" />,
      color: "border-gray-200 bg-gray-50",
      iconColor: "text-gray-600",
    },
  };

  const currentError = errorMessages[errorType];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className={`max-w-2xl w-full ${currentError.color} border-2`}>
        <CardHeader className="text-center pb-4">
          <div
            className={`mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4`}
          >
            <div className={currentError.iconColor}>{currentError.icon}</div>
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {currentError.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-0 bg-white/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-gray-700">
              {currentError.description}
            </AlertDescription>
          </Alert>

          {/* Error Details (for development) */}
          {showDetails && (
            <details className="bg-white/50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Technical Details
              </summary>
              <div className="text-sm space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                <div>
                  <strong>Type:</strong> {error.name}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Quick Solutions */}
          <div className="bg-white/50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">Quick Solutions:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {errorType === "network" && (
                <>
                  <li>• Check your internet connection</li>
                  <li>• Refresh the page</li>
                  <li>• Try again in a few moments</li>
                </>
              )}
              {errorType === "server" && (
                <>
                  <li>• Wait a few minutes and try again</li>
                  <li>• Check our status page for updates</li>
                  <li>• Contact support if the issue persists</li>
                </>
              )}
              {errorType === "permission" && (
                <>
                  <li>• Log out and log back in</li>
                  <li>• Contact your administrator</li>
                  <li>• Check if your account is active</li>
                </>
              )}
              {errorType === "chunk" && (
                <>
                  <li>• Refresh the page (Ctrl+F5)</li>
                  <li>• Clear your browser cache</li>
                  <li>• Try a different browser</li>
                </>
              )}
              {errorType === "client" && (
                <>
                  <li>• Refresh the page</li>
                  <li>• Try the action again</li>
                  <li>• Report the issue to support</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>

          {/* Support Links */}
          <div className="flex justify-center space-x-6 pt-4 border-t border-white/50">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <ExternalLink className="h-4 w-4 mr-2" />
              System Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorBoundaryComponent;
