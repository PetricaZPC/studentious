import React, { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import BlogPost from '../components/BlogPost';
import Sidebar from '../components/Sidebar';

const BLOG_POSTS = [
  {
    id: 1,
    date: 'Jun 1, 2020',
    category: 'Laravel',
    title: 'Build Your New Idea with Laravel Framework',
    excerpt: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit...',
    author: 'Alex John',
    authorImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=731&q=80'
  },
]
const AUTHORS = [
  {
    id: 1,
    name: 'Alex John',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=731&q=80',
  },
  {
    id: 2,
    name: 'Jane Doe',
    avatar: 'https://images.unsplash.com/photo-1402685104226-e9df14d4d9e0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=700&q=60',
  },
  {
    id: 3,
    name: 'John Smith',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=700&q=60',
  },
];

const CATEGORIES = [  
  'Laravel',
  'React',
  'JavaScript',
  'CSS',
  'HTML',
  'Node.js',
  'Python',
];

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [timeframe, setTimeframe] = useState('latest');

  return (
    <div className="overflow-x-hidden bg-gray-100">
      <Header />
      <div className="px-6 py-8">
        <div className="container flex justify-between mx-auto">
          <div className="w-full lg:w-8/12">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-700 md:text-2xl">Posts</h1>
              <div>
                <select 
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-700"
                >
                  <option className='text-gray-700' value="latest ">Latest</option>
                  <option className='text-gray-700' value="lastWeek">Last Week</option>
                </select>
              </div>
            </div>
            
            {BLOG_POSTS.map(post => (
              <BlogPost key={post.id} {...post} />
            ))}

            <nav className="mt-8">
              <div className="flex">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 mx-1 font-medium text-gray-500 bg-white rounded-md disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[1, 2, 3].map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 mx-1 font-medium ${
                      currentPage === page 
                        ? 'bg-purple-700 text-white' 
                        : 'text-gray-700 bg-white hover:bg-purple-500 hover:text-white'
                    } rounded-md`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                  disabled={currentPage === 3}
                  className="px-3 py-2 mx-1 font-medium text-gray-700 bg-white rounded-md hover:bg-purple-500 hover:text-white disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </nav>
          </div>
          <Sidebar authors={AUTHORS} categories={CATEGORIES} />
        </div>
      </div>
      <Footer />
    </div>
  );
}