export default function Sidebar() {
  return (
    <nav className="w-24 fixed left-0 top-0 h-full bg-white p-4 border-r">
      {/* Simple Logo */}
      <div className="h-8 w-8 bg-blue-500 mx-auto rounded-full mb-6"></div>
      
      {/* Simple Navigation Links */}
      <ul className="text-center">
        <li className="mb-4">
          <a href="#">
            <div className="h-5 w-5 bg-blue-500 mx-auto mb-1"></div>
            <span className="text-xs">Dashboard</span>
          </a>
        </li>
        
        <li className="mb-4">
          <a href="#">
            <div className="h-5 w-5 bg-gray-300 mx-auto mb-1"></div>
            <span className="text-xs">Messages</span>
          </a>
        </li>
        
        <li className="mb-4">
          <a href="#">
            <div className="h-5 w-5 bg-gray-300 mx-auto mb-1"></div>
            <span className="text-xs">Courses</span>
          </a>
        </li>
        
        <li className="mb-4">
          <a href="#">
            <div className="h-5 w-5 bg-gray-300 mx-auto mb-1"></div>
            <span className="text-xs">Calendar</span>
          </a>
        </li>
      </ul>

      {/* Simple Help Button */}
      <div className="h-5 w-5 bg-purple-200 mx-auto mt-auto mb-4 rounded-full"></div>
    </nav>
  );
}