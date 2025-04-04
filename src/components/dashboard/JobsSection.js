import JobCard from './JobCard';

export default function JobsSection() {
  const jobs = [
    {
      title: "Physics Tutor",
      company: "Oxford University",
      level: "Advanced",
      salary: "$90/hr",
      type: "Remote",
      posted: "2 days ago"
    },
    {
      title: "Math Instructor",
      company: "Cambridge Academy",
      level: "Intermediate",
      salary: "$75/hr",
      type: "In-person",
      posted: "1 week ago"
    }
  ];

  return (
    <div className="flex-1 pr-5">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Available Jobs
      </h2>
      
      <div className="grid grid-cols-1 gap-5">
        {jobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))}
      </div>
    </div>
  );
}