import React from 'react';

export default function BlogPost({ date, category, title, excerpt, author, authorImage }) {
  return (
    <div className="mt-6">
      <div className="max-w-4xl px-10 py-6 mx-auto bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-light text-gray-600">{date}</span>
          <a href="#" className="px-2 py-1 font-bold text-gray-100 bg-gray-600 rounded hover:bg-gray-500">
            {category}
          </a>
        </div>
        <div className="mt-2">
          <a href="#" className="text-2xl font-bold text-gray-700 hover:underline">{title}</a>
          <p className="mt-2 text-gray-600">{excerpt}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <a href="#" className="text-purple-700 hover:underline">Read more</a>
          <div>
            <a href="#" className="flex items-center">
              <img src={authorImage} alt={`${author}'s avatar`} className="hidden object-cover w-10 h-10 mx-4 rounded-full sm:block" />
              <h2 className="font-bold text-gray-700 hover:underline">{author}</h2>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}