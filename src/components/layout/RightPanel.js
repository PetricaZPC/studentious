export default function RightPanel() {
  return (
    <aside className="fixed right-0 top-0 w-64 h-full bg-white p-4 border-l">
      {/* Simple Profile Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">My Profile</h2>
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="ml-3">
            <div>Alex Morgan</div>
            <div className="text-sm text-gray-500">Student</div>
          </div>
        </div>
      </div>
      
      {/* Simple Progress Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Course Progress</h2>
        <div className="border p-3">
          <div className="flex justify-between">
            <span>Physics 101</span>
            <span>75%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200">
            <div className="h-2 bg-blue-500" style={{ width: '75%' }}></div>
          </div>
          <div className="mt-1 text-sm">
            9 of 12 modules completed
          </div>
        </div>
      </div>
      
      {/* Simple Assignments Section */}
      <div>
        <h2 className="text-lg font-bold mb-2">Upcoming Assignments</h2>
        <div>
          <div className="flex justify-between p-2 border-b">
            <span>Michael Brown</span>
            <span>$135</span>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span>Sarah Johnson</span>
            <span>$90</span>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span>David Wilson</span>
            <span>$180</span>
          </div>
        </div>
      </div>
    </aside>
  );
}