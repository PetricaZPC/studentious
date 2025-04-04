export default function MainContent() {
  // Sample data for jobs
  const jobs = [
    {
      title: "Physics Tutor",
      company: "Oxford University",
      level: "Advanced",
      salary: "$90/hr",
      posted: "2 days ago"
    },
    {
      title: "Math Instructor",
      company: "Cambridge Academy",
      level: "Intermediate",
      salary: "$75/hr",
      posted: "1 week ago"
    }
  ];

  // Sample data for lessons
  const lessons = [
    {
      subject: "Calculus I",
      time: "10:00 AM - 11:30 AM",
      student: "Michael Brown",
      avatar: "MB"
    },
    {
      subject: "Physics 101",
      time: "1:00 PM - 2:30 PM",
      student: "Sarah Johnson",
      avatar: "SJ"
    },
    {
      subject: "Chemistry Lab",
      time: "3:30 PM - 5:00 PM",
      student: "David Wilson",
      avatar: "DW"
    }
  ];

  return (
    <main className="my-1 pt-2 pb-2 px-10 flex-1 bg-gray-200 dark:bg-black rounded-l-lg transition duration-500 ease-in-out overflow-y-auto">
      {/* Welcome Header Section */}
      <div className="pb-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800 dark:text-gray-200">
              Welcome back, Alex
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-400">
              Here's what's happening with your schedule today
            </p>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <input
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
                type="text"
                placeholder="Search..."
              />
              <span className="absolute right-3 top-2 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
            </div>
          </div>
        </header>
      </div>
      
      <div className="flex">
        {/* Available Jobs Section */}
        <div className="flex-1 pr-5">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Available Courses
          </h2>
          
          <div className="grid grid-cols-1 gap-5">
            {jobs.map((job, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-medium text-gray-800 dark:text-white">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{job.company}</p>
                    
                    <div className="flex mt-2 space-x-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                        {job.level}
                      </span>
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
                        {job.salary}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {job.posted}
                  </div>
                </div>
                
                <div className="mt-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule Section */}
        <div className="w-2/5">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Today's Schedule
          </h2>
          
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md">
            {lessons.map((lesson, index) => (
              <div key={index} className={`flex items-center py-3 ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-600' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  {lesson.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-800 dark:text-white">
                    {lesson.subject}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {lesson.time}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {lesson.student}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}