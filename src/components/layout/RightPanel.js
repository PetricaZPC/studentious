export default function RightPanel() {

  const payments = [
    { student: "Michael Brown", amount: "$135", date: "Apr 3, 2025" },
    { student: "Sarah Johnson", amount: "$90", date: "Apr 1, 2025" },
    { student: "David Wilson", amount: "$180", date: "Mar 28, 2025" }
  ];

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 p-6 rounded-r-lg overflow-y-auto">

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          My Profile
        </h2>
        <div className="flex items-center">
          <img
            className="h-16 w-16 rounded-full object-cover"
            src="https://randomuser.me/api/portraits/women/42.jpg"
            alt="Profile"
          />
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Alex Morgan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Student
            </p>
          </div>
        </div>
      </div>
      

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Course Progress
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 dark:text-blue-200">Physics 101</span>
            <span className="text-2xl font-bold text-blue-800 dark:text-blue-200">75%</span>
          </div>
          <div className="mt-4 h-2 bg-blue-200 dark:bg-blue-700 rounded">
            <div className="h-2 bg-blue-600 rounded" style={{ width: '75%' }}></div>
          </div>
          <div className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            9 of 12 modules completed
          </div>
        </div>
      </div>
      

      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Upcoming Assignments
        </h2>
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="flex justify-between p-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">{payment.student}</span>
              <div className="text-right">
                <div className="text-orange-600 dark:text-orange-400 font-medium">{payment.amount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Due: {payment.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}