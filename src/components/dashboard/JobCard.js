export default function JobCard({ job }) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md">
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
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
              {job.type}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {job.posted}
        </div>
      </div>
      
      <div className="mt-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
          Apply Now
        </button>
      </div>
    </div>
  );
}