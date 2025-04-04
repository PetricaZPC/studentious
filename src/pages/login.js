import React, { useState } from 'react';
import { useRouter } from 'next/router';


export default function Login() {
  const [isLoginForm, setIsLoginForm] = useState(true);

  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-500 bg-no-repeat bg-cover relative"
      style={{
        backgroundImage: "url(https://images.unsplash.com/photo-1525302220185-c387a117886e?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)"
      }}
    >
      <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isLoginForm ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLoginForm ? "Please sign in to your account" : "Please register to get started"}
          </p>
        </div>
        <div className="flex flex-row justify-center items-center space-x-3">
          <span className="w-11 h-11 items-center justify-center inline-flex rounded-full font-bold text-lg text-white bg-blue-900 hover:shadow-lg cursor-pointer transition ease-in duration-300"></span>
          <span className="w-11 h-11 items-center justify-center inline-flex rounded-full font-bold text-lg text-white bg-blue-400 hover:shadow-lg cursor-pointer transition ease-in duration-300"></span>
          <span className="w-11 h-11 items-center justify-center inline-flex rounded-full font-bold text-lg text-white bg-blue-500 hover:shadow-lg cursor-pointer transition ease-in duration-300"></span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <span className="h-px w-16 bg-gray-300"></span>
          <span className="text-gray-500 font-normal">OR</span>
          <span className="h-px w-16 bg-gray-300"></span>
        </div>
        
        {isLoginForm ? (
          // Login Form
          <form className="mt-8 space-y-6" action="#" method="POST">
            <input type="hidden" name="remember" value="true" />
            <div className="relative">
              <div className="absolute right-0 mt-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <label className="text-sm font-bold text-gray-700 tracking-wide">Email</label>
              <input 
                className="w-full text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500" 
                type="email" 
                placeholder="mail@gmail.com" 
                defaultValue="mail@gmail.com"
              />
            </div>
            <div className="mt-8 content-center">
              <label className="text-sm font-bold text-gray-700 tracking-wide">
                Password
              </label>
              <input 
                className="w-full content-center text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500" 
                type="password" 
                placeholder="Enter your password" 
                defaultValue="*****"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember_me" 
                  name="remember_me" 
                  type="checkbox" 
                  className="h-4 w-4 bg-indigo-500 focus:ring-indigo-400 border-gray-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-500 hover:text-indigo-500">
                  Forgot your password?
                </a>
              </div>
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center bg-indigo-500 text-gray-100 p-4 rounded-full tracking-wide
                           font-semibold focus:outline-none focus:shadow-outline hover:bg-indigo-600 shadow-lg cursor-pointer transition ease-in duration-300"
              >
                Sign in
              </button>
            </div>
            <p className="flex flex-col items-center justify-center mt-10 text-center text-md text-gray-500">
              <span>Don&apos;t have an account?</span>
              <button 
                type="button"
                onClick={toggleForm}
                className="text-indigo-500 hover:text-indigo-500 hover:underline cursor-pointer transition ease-in duration-300"
              >
                Sign up
              </button>
            </p>
          </form>
        ) : (
          // Registration Form
          <form className="mt-8 space-y-6" action="#" method="POST">
            <div className="relative">
              <label className="text-sm font-bold text-gray-700 tracking-wide">Full Name</label>
              <input 
                className="w-full text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500" 
                type="text" 
                placeholder="John Doe" 
              />
            </div>
            <div className="relative">
              <label className="text-sm font-bold text-gray-700 tracking-wide">Email</label>
              <input 
                className="w-full text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500" 
                type="email" 
                placeholder="mail@gmail.com" 
              />
            </div>
            <div className="mt-8 content-center">
              <label className="text-sm font-bold text-gray-700 tracking-wide">
                Password
              </label>
              <input 
                className="w-full content-center text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500" 
                type="password" 
                placeholder="Enter your password" 
              />
            </div>
            <div className="mt-8 content-center">
              <label className="text-sm font-bold text-gray-700 tracking-wide">
                Confirm Password
              </label>
              <input 
                className="w-full content-center text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500" 
                type="password" 
                placeholder="Confirm your password" 
              />
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center bg-indigo-500 text-gray-100 p-4 rounded-full tracking-wide
                           font-semibold focus:outline-none focus:shadow-outline hover:bg-indigo-600 shadow-lg cursor-pointer transition ease-in duration-300"
              >
                Create Account
              </button>
            </div>
            <p className="flex flex-col items-center justify-center mt-10 text-center text-md text-gray-500">
              <span>Already have an account?</span>
              <button 
                type="button"
                onClick={toggleForm}
                className="text-indigo-500 hover:text-indigo-500 hover:underline cursor-pointer transition ease-in duration-300"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}