export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          HRM ERP System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to your Human Resource Management System
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Frontend:</span>
              <span className="text-green-600">✓ Running</span>
            </div>
            <div className="flex justify-between">
              <span>API:</span>
              <span className="text-yellow-600">⏳ Connecting...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
