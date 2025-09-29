// components/debug/PerformanceMonitor.jsx
import { useState, useEffect } from "react";
import { Activity, Clock, Database, Server, MapPin } from "lucide-react";

const PerformanceMonitor = ({
  enabled = process.env.NODE_ENV === "development",
}) => {
  const [metrics, setMetrics] = useState({
    apiCalls: 0,
    avgResponseTime: 0,
    slowQueries: [],
    memoryUsage: 0,
    renderTime: 0,
    statesLgasLoadTime: 0,
    backendDiagnostics: null,
  });

  const [isVisible, setIsVisible] = useState(false);
  const [lastDiagnosticsCheck, setLastDiagnosticsCheck] = useState(null);

  // Function to fetch backend diagnostics
  const fetchBackendDiagnostics = async () => {
    try {
      const response = await fetch('/api/performance/diagnostics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMetrics((prev) => ({
            ...prev,
            backendDiagnostics: data.data,
            statesLgasLoadTime: data.data.states_lgas_load?.time_ms || 0,
          }));
          setLastDiagnosticsCheck(new Date());
        }
      }
    } catch (error) {
      console.warn('Could not fetch backend diagnostics:', error);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();

    // Monitor performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "measure" && entry.name.includes("api-call")) {
          setMetrics((prev) => ({
            ...prev,
            apiCalls: prev.apiCalls + 1,
            avgResponseTime: (prev.avgResponseTime + entry.duration) / 2,
          }));

          if (entry.duration > 1000) {
            // Slow query > 1s
            setMetrics((prev) => ({
              ...prev,
              slowQueries: [
                ...prev.slowQueries.slice(-4),
                {
                  name: entry.name,
                  duration: entry.duration,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ],
            }));
          }
        }
      }
    });

    observer.observe({ entryTypes: ["measure"] });

    // Memory usage monitoring
    const updateMemory = () => {
      if (performance.memory) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    const memoryInterval = setInterval(updateMemory, 5000);

    // Component render time
    const endTime = performance.now();
    setMetrics((prev) => ({
      ...prev,
      renderTime: endTime - startTime,
    }));

    // Fetch backend diagnostics on mount and every 30 seconds
    fetchBackendDiagnostics();
    const diagnosticsInterval = setInterval(fetchBackendDiagnostics, 30000);

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
      clearInterval(diagnosticsInterval);
    };
  }, [enabled]);

  if (!enabled) return null;

  const getPerformanceColor = (timeMs) => {
    if (timeMs < 100) return "text-green-500";
    if (timeMs < 500) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      {/* Floating Performance Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Monitor
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchBackendDiagnostics}
                className="text-blue-500 hover:text-blue-700 p-1"
                title="Refresh diagnostics"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* API Calls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">API Calls</span>
              </div>
              <span className="text-sm font-medium">{metrics.apiCalls}</span>
            </div>

            {/* Response Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Avg Response</span>
              </div>
              <span
                className={`text-sm font-medium ${
                  metrics.avgResponseTime > 1000
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {metrics.avgResponseTime.toFixed(0)}ms
              </span>
            </div>

            {/* States/LGAs Load Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">States/LGAs</span>
              </div>
              <span
                className={`text-sm font-medium ${getPerformanceColor(metrics.statesLgasLoadTime)}`}
              >
                {metrics.statesLgasLoadTime.toFixed(1)}ms
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Memory</span>
              </div>
              <span className="text-sm font-medium">
                {metrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>

            {/* Render Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Render Time</span>
              </div>
              <span className="text-sm font-medium">
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>

            {/* Backend Diagnostics Summary */}
            {metrics.backendDiagnostics && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Backend Performance
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Tests:</span>
                    <span className="font-medium">
                      {metrics.backendDiagnostics.summary?.tests_passed}/{metrics.backendDiagnostics.summary?.tests_total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overall Time:</span>
                    <span className={`font-medium ${getPerformanceColor(metrics.backendDiagnostics.summary?.total_time_ms)}`}>
                      {metrics.backendDiagnostics.summary?.total_time_ms?.toFixed(1)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span className={`font-medium capitalize ${
                      metrics.backendDiagnostics.summary?.performance_rating === 'excellent' ? 'text-green-600' :
                      metrics.backendDiagnostics.summary?.performance_rating === 'good' ? 'text-green-500' :
                      metrics.backendDiagnostics.summary?.performance_rating === 'acceptable' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {metrics.backendDiagnostics.summary?.performance_rating}
                    </span>
                  </div>
                  {lastDiagnosticsCheck && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last checked: {lastDiagnosticsCheck.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Slow Queries */}
            {metrics.slowQueries.length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-red-600 mb-2">
                  Slow Queries
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {metrics.slowQueries.map((query, index) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded">
                      <div className="font-medium text-red-700">
                        {query.duration.toFixed(0)}ms
                      </div>
                      <div className="text-red-600">{query.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Recommendations */}
            {metrics.backendDiagnostics?.summary?.recommendations && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-blue-600 mb-2">
                  Recommendations
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {metrics.backendDiagnostics.summary.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-xs bg-blue-50 p-2 rounded text-blue-700">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;
