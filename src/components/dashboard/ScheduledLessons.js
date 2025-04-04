export default function ScheduledLessons() {
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
  );
}