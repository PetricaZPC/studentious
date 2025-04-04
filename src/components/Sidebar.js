import React from 'react';

export default function Sidebar({ authors, categories }) {
  return (
    <div className="hidden w-4/12 -mx-8 lg:block">
      <div className="px-8">
        <h1 className="mb-4 text-xl font-bold text-gray-700">Authors</h1>
        <div className="flex flex-col max-w-sm px-6 py-4 mx-auto bg-white rounded-lg shadow-md">
          <ul className="-mx-4">
            {authors.map((author) => (
              <li key={author.name} className="flex items-center mt-6 first:mt-0">
                <img src={author.avatar} alt={`${author.name}'s avatar`} className="object-cover w-10 h-10 mx-4 rounded-full" />
                <p>
                  <a href="#" className="mx-1 font-bold text-gray-700 hover:underline">{author.name}</a>
                  <span className="text-sm font-light text-gray-700">Created {author.posts} Posts</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}