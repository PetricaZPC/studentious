import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './api/context/AuthContext';
import Head from 'next/head';

export default function Login() {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginForm) {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
      }
      router.push('/');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <>
  <Head>
    <title>{isLoginForm ? 'Login' : 'Sign Up'} | Studentious</title>
  </Head>
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-800">
          {isLoginForm ? 'Welcome back' : 'Join Studentious'}
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {isLoginForm ? 'Continue your learning journey' : 'Start your educational adventure'}
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLoginForm && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Password</label>
              {isLoginForm && (
                <a href="#" className="text-xs text-purple-600 hover:text-purple-500">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder={isLoginForm ? 'Enter your password' : 'Create a password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            {!isLoginForm && (
              <p className="text-xs text-gray-500 mt-1">Use 8 or more characters with a mix of letters, numbers & symbols</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-md transition-all ${
              loading 
                ? 'bg-purple-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isLoginForm ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLoginForm ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLoginForm(!isLoginForm)}
            className="ml-1 font-medium text-purple-600 hover:text-purple-500 transition-colors"
          >
            {isLoginForm ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500">
        By continuing, you agree to our <a href="#" className="text-purple-600 hover:underline">Terms</a> and <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>.
      </div>
    </div>
  </div>
</>
  );
}