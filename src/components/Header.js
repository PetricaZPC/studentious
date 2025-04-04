import React, { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="px-6 py-4 bg-white shadow">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex justify-between items-center">
          <div>
            <a href="#" className="text-xl font-bold text-gray-800 md:text-2xl">
              <span className="text-purple-700">Student</span>
              ious
            </a>
          </div>
          <div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button" 
              className="block text-gray-800 hover:text-gray-600 focus:text-gray-600 focus:outline-none md:hidden"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className={`flex-col md:flex md:flex-row md:-mx-4 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <a href="#" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Home</a>
          <a href="#" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Blog</a>
          <a href="#" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">About us</a>
          <a href="#" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Contact</a>
        </div>
      </div>
    </nav>
  );
}
