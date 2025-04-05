import { useState, useEffect } from 'react';
import { useAuth } from '@/pages/api/context/AuthContext';
import { db, storage } from '@/pages/api/config/firebaseConfig';
import { 
  collection, addDoc, getDocs, query, 
  orderBy, serverTimestamp, doc, updateDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const courseList = [];
      querySnapshot.forEach((doc) => {
        courseList.push({ id: doc.id, ...doc.data() });
      });
      
      setCourses(courseList);
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
      
      // 1. Upload file to Firebase Storage
      const fileRef = ref(storage, `courses/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      
      // 2. Get download URL
      const fileUrl = await getDownloadURL(fileRef);
      
      // 3. Store course info in Firestore
      const courseData = {
        name: courseName,
        description: courseDescription,
        fileUrl,
        fileName: file.name,
        fileType: file.name.split('.').pop().toLowerCase(),
        uploadedBy: user.uid,
        uploaderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        summarized: false,
        summary: ''
      };
      
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      
      setSuccess('Course uploaded successfully!');
      setCourseName('');
      setCourseDescription('');
      setFile(null);
      
      // 4. Request summary
      setIsSummarizing(true);
      await generateSummary(docRef.id, fileUrl, file.name.split('.').pop().toLowerCase());
      
      // 5. Refresh course list
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
      // Create a simple proxy URL for our API
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          fileUrl,
          fileType
        })
      });
      
      if (!response.ok) {
        throw new Error('Summary generation failed');
      }
      
      const data = await response.json();
      
      // Update the document with the summary
      await updateDoc(doc(db, 'courses', courseId), {
        summary: data.summary || 'No summary available',
        summarized: true
      });
      
    } catch (err) {
      console.error('Error generating summary:', err);
      await updateDoc(doc(db, 'courses', courseId), {
        summary: 'Failed to generate summary',
        summarized: true
      });
    }
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
                <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      Uploaded: {course.createdAt ? new Date(course.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                    </span>
                    
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}