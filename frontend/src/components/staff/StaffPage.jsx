export default function Staff1Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
      <p className="mb-4">Welcome! Manage your HR tasks and access key information here.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <ul className="mt-2 space-y-2">
            <li><a href="/dashboard/staff/leave" className="text-blue-500 hover:underline">Apply for Leave</a></li>
            <li><a href="/dashboard/staff/payslip" className="text-blue-500 hover:underline">View Payslip</a></li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Upcoming</h2>
          <p className="mt-2">No upcoming events scheduled.</p>
        </div>
      </div>
    </div>
  );
}