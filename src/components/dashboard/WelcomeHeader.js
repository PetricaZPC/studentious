export default function WelcomeHeader() {
  return (
    <div className="pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-gray-800 dark:text-gray-200">
            Welcome back, Alex
          </h1>
          <p className="text-md text-gray-600 dark:text-gray-400">
            Goodluck with your lessons today! Here’s what you need to know:
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
  );
}