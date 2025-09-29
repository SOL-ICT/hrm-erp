// components/ErrorBoundary.jsx
"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Check if it's a chunk error
    const isChunkError =
      error.message &&
      (error.message.includes("ChunkLoadError") ||
        error.message.includes("Loading chunk") ||
        error.message.includes("Failed to import") ||
        error.message.includes("Loading CSS chunk"));

    this.setState({
      error,
      errorInfo,
      isChunkError,
    });

    // Auto-reload on chunk errors after a short delay
    if (isChunkError) {
      console.log("🔄 Chunk error detected - auto-reloading in 2 seconds...");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  handleReload = () => {
    // Clear all caches and reload
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError } = this.state;

      if (isChunkError) {
        // Auto-reloading chunk error
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Updating Application...
              </h2>
              <p className="text-gray-600 mb-4">
                The app is being updated. Reloading automatically...
              </p>
              <div className="text-sm text-gray-500">
                If this doesn't resolve automatically, try clearing your browser
                cache.
              </div>
            </div>
          </div>
        );
      }

      // General error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2 overflow-auto max-h-32">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
