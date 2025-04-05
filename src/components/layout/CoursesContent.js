import { useState, useEffect } from 'react';
import { useAuth } from '@/pages/api/context/AuthContext';

export default function CoursesContent() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [summarizingCourseId, setSummarizingCourseId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses/list', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCourses(data.courses);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check file type
    const fileType = selectedFile.name.split('.').pop().toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'doc' && fileType !== 'docx') {
      setError('Please upload only PDF or Word documents');
      setFile(null);
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!courseName.trim()) {
      setError('Please enter a course name');
      return;
    }
    
    if (!file) {
      setError('Please upload a document');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setIsUploading(true);
      
      // 1. Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', courseName);
      formData.append('description', courseDescription);
      
      // 2. Upload file and course data to MongoDB via API
      const response = await fetch('/api/courses/create', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload course');
      }
      
      const data = await response.json();
      
      setSuccess('Course uploaded successfully!');
      setCourseName('');
      setCourseDescription('');
      setFile(null);
      
      // 3. Request summary (already handled by backend in this case)
      setIsSummarizing(true);
      await generateSummary(data.courseId, data.fileUrl, data.fileType);
      
      // 4. Refresh course list
      fetchCourses();
      
    } catch (err) {
      console.error('Error uploading course:', err);
      setError('Failed to upload course: ' + err.message);
    } finally {
      setIsUploading(false);
      setIsSummarizing(false);
    }
  };

  const generateSummary = async (courseId, fileUrl, fileType) => {
    try {
      setSummarizingCourseId(courseId);
      const response = await fetch('/api/courses/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          fileUrl,
          fileType
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Summary generation failed');
      }
      
      await response.json();
      fetchCourses(); // Refresh to show the new summary
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setSummarizingCourseId(null);
    }
  };

  const viewCourse = (course) => {
    setViewingCourse(course);
  };

  const closeViewer = () => {
    setViewingCourse(null);
  };

  return (<div className="w-full max-w-6xl mx-auto">
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6 ">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">Course Management</h1>
        
        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Course</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Course Name
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter course name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description (Optional)
              </label>
              <textarea
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter course description"
                rows="3"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Upload Document (PDF or Word)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PDF or Word up to 5MB</p>
                </div>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}
            
            {success && (
              <div className="mb-4 text-green-500 text-sm">{success}</div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isUploading || isSummarizing}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : isSummarizing ? 'Summarizing...' : 'Upload Course'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Course List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-8 h-8 mx-auto animate-spin"></div>
              <p className="mt-2 text-gray-500">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>You haven't uploaded any courses yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map(course => (
                <div key={course._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{course.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${course.fileType === 'pdf' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {course.fileType.toUpperCase()}
                    </span>
                  </div>
                  
                  {course.description && (
                    <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                  )}
                  
                  {course.summarized && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-1">AI Summary:</h4>
                      <p className="text-sm text-gray-700 line-clamp-3">{course.summary}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      Uploaded: {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewCourse(course)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View
                      </button>
                      
                      <a 
                        href={course.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                      
                      {!course.summarized && (
                        <button
                          onClick={() => generateSummary(course._id, course.fileUrl, course.fileType)}
                          disabled={summarizingCourseId === course._id}
                          className="text-green-500 hover:text-green-700 flex items-center disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
                          </svg>
                          {summarizingCourseId === course._id ? 'Summarizing...' : 'Summarize'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Document Viewer Modal */}
    {viewingCourse && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{viewingCourse.name}</h3>
            <button onClick={closeViewer} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {viewingCourse.fileType === 'pdf' ? (
              <iframe 
                src={viewingCourse.fileUrl} 
                className="w-full h-full border-none" 
                title={viewingCourse.name}
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="mb-4 text-gray-600">Word documents can't be previewed directly.</p>
                  <a 
                    href={viewingCourse.fileUrl} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Download to View
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {viewingCourse.summarized && (
            <div className="p-4 border-t">
              <h4 className="font-medium mb-2">AI Summary</h4>
              <p className="text-gray-700">{viewingCourse.summary}</p>
            </div>
          )}
        </div>
      </div>
    )}
    </div>
  );
}