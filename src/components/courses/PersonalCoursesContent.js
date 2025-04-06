import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/pages/api/context/AuthContext';
import { IoClose, IoDocument, IoVolumeHigh, IoPause, IoPlay, IoCheckmarkCircle, IoWarning, IoCalendar, IoTime, IoEye, IoCloudDownload, IoSparkles } from 'react-icons/io5';
import { BsTranslate } from 'react-icons/bs';
import CourseViewer from './CourseViewer';
import SummarizeOptionsModal from './SummarizeOptionsModal';

export default function PersonalCoursesContent() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // File upload state
  const [file, setFile] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Summary state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizingCourseId, setSummarizingCourseId] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showSummarizeOptions, setShowSummarizeOptions] = useState(false);
  const [courseForSummarization, setCourseForSummarization] = useState(null);
  
  // Viewer state
  const [viewingCourse, setViewingCourse] = useState(null);
  const [viewingSummary, setViewingSummary] = useState(null);

  // Audio state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatingAudioForCourse, setGeneratingAudioForCourse] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRef = useRef(null);

  // Animation state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Translation state
  const [translatingCourseId, setTranslatingCourseId] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Fetch user's courses
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/courses/list', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load your courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // File upload handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name, selectedFile.type);
      
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      // Validate file type
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (fileType !== 'pdf' && fileType !== 'doc' && fileType !== 'docx') {
        setError('Only PDF and Word documents are allowed');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !courseName) {
      setError('Please provide a file and course name');
      return;
    }
    
    setIsUploading(true);
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', courseName);
      formData.append('description', courseDescription);
      formData.append('isPublic', isPublic);
      
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
      
      fetchCourses();
      
      // Animation for success message
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 300);
      
    } catch (err) {
      console.error('Error uploading course:', err);
      setError('Failed to upload course: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Toggle public/private status of a course
  const togglePublicStatus = async (courseId, currentStatus) => {
    try {
      const response = await fetch('/api/courses/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId, 
          isPublic: !currentStatus 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update course');
      }
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId ? { ...course, isPublic: !currentStatus } : course
        )
      );
      
      setSuccess(`Course is now ${!currentStatus ? 'public' : 'private'}`);
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 300);
      
    } catch (err) {
      console.error('Error updating course visibility:', err);
      setError('Failed to update course: ' + err.message);
    }
  };

  // View a specific course (document)
  const viewCourse = (course) => {
    console.log("Opening course viewer for:", course.name, course.fileUrl);
    setViewingCourse(course);
  };
  
  const closeViewer = () => {
    setViewingCourse(null);
  };
  
  // View the summary of a course
  const viewSummary = (course) => {
    setViewingSummary(course);
  };
  
  const closeSummaryViewer = () => {
    setViewingSummary(null);
  };

  // Generate a summary for a course
  const generateSummary = async (courseId, options = {}) => {
    setIsGeneratingSummary(true);
    setSummarizingCourseId(courseId);
    setError('');

    try {
      console.log('Sending summary request for courseId:', courseId, 'with options:', options);

      const response = await fetch('/api/courses/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId,
          options,
          forceRegenerate: true
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API error:', data);
        
        if (data.message === 'Course file not found' || data.message === 'Course file not found in database') {
          throw new Error('The course file could not be found. It may have been deleted or corrupted. Please try re-uploading the file.');
        }
        
        throw new Error(data.message || data.error || 'Summary generation failed');
      }
      
      console.log('Summary generated successfully:', data.summary.substring(0, 100) + '...');
      
      // Update the course in your UI state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId ? {
            ...course,
            summary: data.summary,
            summarized: true,
            detectedLanguage: data.detectedLanguage
          } : course
        )
      );
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Summary generated successfully!'
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } catch (err) {
      console.error('Summary generation error:', err);
      
      // Show error notification with a clear message
      setNotification({
        type: 'error',
        message: err.message || 'Summary generation failed'
      });
      
      // Keep the error more persistent since it's important
      setTimeout(() => {
        setNotification(null);
      }, 7000);
    } finally {
      setIsGeneratingSummary(false);
      setSummarizingCourseId(null);
    }
  };

  // Show summarize options modal
  const showSummarizeOptionsForCourse = (course) => {
    setCourseForSummarization(course);
    setShowSummarizeOptions(true);
  };

  // Generate audio from summary or description
  const generateAudio = async (course) => {
    if (isGeneratingAudio) return;
    
    try {
      setIsGeneratingAudio(true);
      setGeneratingAudioForCourse(course._id);
      setError('');
      setSuccess('');
      
      const textToConvert = course.summarized ? course.summary : course.description;
      
      if (!textToConvert || textToConvert.trim() === '') {
        setError('No content available to convert to audio');
        setIsGeneratingAudio(false);
        setGeneratingAudioForCourse(null);
        return;
      }
      
      const response = await fetch('/api/courses/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course._id,
          text: textToConvert
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate audio');
      }
      
      // Update the course with audio info
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c._id === course._id ? {
            ...c,
            audioId: data.audioId,
            audioUrl: data.audioUrl,
            audioGeneratedAt: new Date()
          } : c
        )
      );
      
      setSuccess('Audio generated successfully!');
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 300);
      
    } catch (err) {
      console.error('Error generating audio:', err);
      setError(err.message || 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
      setGeneratingAudioForCourse(null);
    }
  };

  // Toggle audio playback
  const toggleAudio = (course) => {
    if (!course.audioId && !course.audioUrl) return;
    
    if (currentlyPlaying === course._id) {
      // Currently playing this course, pause it
      if (audioRef.current) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      // Play this course's audio
      if (audioRef.current) {
        audioRef.current.pause(); // Pause any currently playing audio
      }
      
      const audioUrl = course.audioUrl || `/api/courses/audio/${course.audioId}`;
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
      
      audioRef.current.play().then(() => {
        setCurrentlyPlaying(course._id);
      }).catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
      });
    }
  };

  // Translate a summary to another language
  const translateSummary = async (course, targetLanguage) => {
    if (isTranslating) return;
    
    if (!course.summary) {
      setNotification({
        type: 'error',
        message: 'No summary available to translate'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // If the target language matches the detected language, no need to translate
    if (targetLanguage === course.detectedLanguage) {
      setNotification({
        type: 'error',
        message: 'Summary is already in this language'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setIsTranslating(true);
    setTranslatingCourseId(course._id);
    
    try {
      console.log('Translating to:', targetLanguage);
      
      const response = await fetch('/api/courses/translate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId: course._id,
          targetLanguage 
        }),
        credentials: 'include'
      });
      
      // Read the response text first
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Received invalid response from server');
      }
      
      if (!response.ok) {
        console.error('Translation API error:', data);
        throw new Error(data.message || data.error || 'Translation failed');
      }
      
      // Update the course in state
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c._id === course._id ? {
            ...c,
            translations: {
              ...(c.translations || {}),
              [targetLanguage]: {
                summary: data.translatedSummary,
                timestamp: new Date()
              }
            }
          } : c
        )
      );
      
      // If we're in the summary viewer, update the viewing summary
      if (viewingSummary && viewingSummary._id === course._id) {
        setViewingSummary({
          ...viewingSummary,
          translations: {
            ...(viewingSummary.translations || {}),
            [targetLanguage]: {
              summary: data.translatedSummary,
              timestamp: new Date()
            }
          }
        });
      }
      
      setNotification({
        type: 'success',
        message: 'Summary translated successfully!'
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } catch (err) {
      console.error('Translation error:', err);
      
      setNotification({
        type: 'error',
        message: err.message || 'Translation failed'
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setIsTranslating(false);
      setTranslatingCourseId(null);
    }
  };

  return (
    <div>
      {/* Success/error notifications */}
      {notification && (
        <div className={`mb-8 ${notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'} shadow-md rounded-lg overflow-hidden transition-all duration-300 ${showSuccessAnimation ? 'transform scale-[1.02]' : ''}`}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${notification.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'} rounded-full p-1`}>
                {notification.type === 'success' ? (
                  <IoCheckmarkCircle className="h-6 w-6" />
                ) : (
                  <IoWarning className="h-6 w-6" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{notification.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className={`flex-shrink-0 ml-4 p-1 rounded-full ${notification.type === 'success' ? 'hover:bg-green-100' : 'hover:bg-red-100'} transition-colors duration-200 focus:outline-none focus:ring-2 ${notification.type === 'success' ? 'focus:ring-green-400' : 'focus:ring-red-400'}`}
            >
              <IoClose className={`h-5 w-5 ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`} />
            </button>
          </div>
        </div>
      )}
      
      {/* Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Upload form - Left column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="h-6 w-6 mr-2 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload New Course
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                    placeholder="Enter course name"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                    placeholder="Enter course description"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Upload Document (PDF or Word)
                  </label>
                  <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition cursor-pointer group"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <div className="space-y-2 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500 transition duration-300" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-700 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input 
                            id="file-upload"
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange} 
                            accept=".pdf,.doc,.docx" 
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PDF or Word up to 5MB</p>
                    </div>
                  </div>
                  {file && (
                    <div className="mt-3 flex items-center text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <IoDocument className="h-5 w-5 mr-2 text-indigo-500" />
                      <div className="overflow-hidden">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">({Math.round(file.size / 1024)} KB)</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Public/Private Toggle */}
                <div className="flex items-center">
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this course public
                  </label>
                </div>
                <p className="text-xs text-gray-500 -mt-4 ml-6">
                  Public courses are visible to all users, even those who aren't logged in
                </p>
                
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isUploading || isSummarizing}
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : isSummarizing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Summarizing...
                      </>
                    ) : 'Upload Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Courses list - Right column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg className="h-6 w-6 mr-2 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                My Courses
              </h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-4 border-l-4 border-purple-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                    <div className="absolute inset-4 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin" style={{animationDuration: '2s'}}></div>
                  </div>
                  <p className="mt-4 text-indigo-700 font-medium">Loading your courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-white to-indigo-50 rounded-xl border border-indigo-100">
                  <div className="bg-white h-24 w-24 rounded-full shadow-md flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                    <IoDocument className="h-12 w-12 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">Upload your first course to start learning and creating audio summaries.</p>
                  <button 
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Your First Course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                  {courses.map(course => (
                    <div 
                      key={course._id} 
                      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-100 hover:border-indigo-200 transition-all duration-300 flex flex-col"
                    >
                      {/* Course Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-800 leading-tight line-clamp-1">{course.name}</h3>
                          <span className={`ml-2 flex-shrink-0 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            course.fileType === 'pdf' ? 'bg-red-100 text-red-800' : 
                            course.fileType === 'doc' || course.fileType === 'docx' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {course.fileType?.toUpperCase() || 'DOC'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Course Content */}
                      <div className="p-4 flex-grow">
                        {course.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                        )}
                        
                        {/* Visibility Badge */}
                        <div className="mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.isPublic 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Summary Section */}
                          {course.summarized && (
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors duration-200">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <IoSparkles className="h-4 w-4 text-indigo-500 mr-2" />
                                  <h4 className="text-sm font-semibold text-gray-700">AI Summary</h4>
                                </div>
                                <button
                                  onClick={() => viewSummary(course)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:underline"
                                >
                                  View Full
                                </button>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-3 italic">{course.summary?.split('\n')[0]}</p>
                            </div>
                          )}
                          
                          {/* Audio Section */}
                          {(course.audioId || course.audioUrl) && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 hover:border-blue-300 transition-colors duration-200">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <IoVolumeHigh className="h-4 w-4 text-blue-600 mr-2" />
                                  <h4 className="text-sm font-semibold text-blue-800">Audio Podcast</h4>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => toggleAudio(course)}
                                    aria-label={currentlyPlaying === course._id ? "Pause audio" : "Play audio"}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                                      currentlyPlaying === course._id 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                                    } transition-colors duration-200 shadow-sm`}
                                  >
                                    {currentlyPlaying === course._id ? (
                                      <IoPause className="h-4 w-4" />
                                    ) : (
                                      <IoPlay className="h-4 w-4" />
                                    )}
                                  </button>
                                  
                                  <a 
                                    href={`/api/courses/audio/${course.audioId}?download=true`}
                                    aria-label="Download audio"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors duration-200 shadow-sm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <IoCloudDownload className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                              <div className="flex items-center text-xs text-blue-700 mt-1">
                                <IoTime className="h-3 w-3 mr-1.5" />
                                <span>Generated: {course.audioGeneratedAt ? new Date(course.audioGeneratedAt).toLocaleString() : 'Recently'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Course Footer */}
                      <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs text-gray-500 flex items-center">
                            <IoCalendar className="h-3 w-3 mr-1.5" />
                            <span className="whitespace-nowrap">
                              {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* Toggle Public/Private Button */}
                            <button
                              onClick={() => togglePublicStatus(course._id, course.isPublic)}
                              className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white ${
                                course.isPublic
                                  ? 'text-green-600 border border-green-200 hover:bg-green-50'
                                  : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                              } shadow-sm transition-colors duration-200`}
                            >
                              <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {course.isPublic ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542-7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                )}
                              </svg>
                              {course.isPublic ? 'Make Private' : 'Make Public'}
                            </button>
                            
                            {/* View Button */}
                            <button
                              onClick={() => viewCourse(course)}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors duration-200"
                            >
                              <IoEye className="h-3.5 w-3.5 mr-1.5" />
                              View
                            </button>
                            
                            {/* Download Button */}
                            <a 
                              href={course.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm transition-colors duration-200"
                            >
                              <IoCloudDownload className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </a>
                            
                            {/* Generate Audio Button */}
                            {(!course.audioId && !course.audioUrl) && (course.summarized || course.description) && (
                              <button
                                onClick={() => generateAudio(course)}
                                disabled={isGeneratingAudio}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {generatingAudioForCourse === course._id ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5 mr-1.5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <IoVolumeHigh className="h-3.5 w-3.5 mr-1.5" />
                                    Generate Audio
                                  </>
                                )}
                              </button>
                            )}
                            
                            {/* Summarize Button */}
                            {!course.summarized && (
                              <button
                                onClick={() => showSummarizeOptionsForCourse(course)}
                                disabled={summarizingCourseId === course._id}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-green-600 border border-green-200 hover:bg-green-50 shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {summarizingCourseId === course._id ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5 mr-1.5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Summarizing...
                                  </>
                                ) : (
                                  <>
                                    <IoSparkles className="h-3.5 w-3.5 mr-1.5" />
                                    Summarize
                                  </>
                                )}
                              </button>
                            )}

                            {/* Re-Summarize Button */}
                            {course.summarized && (
                              <button
                                onClick={() => showSummarizeOptionsForCourse(course)}
                                disabled={summarizingCourseId === course._id}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {summarizingCourseId === course._id ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5 mr-1.5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Summarizing...
                                  </>
                                ) : (
                                  <>
                                    <IoSparkles className="h-3.5 w-3.5 mr-1.5" />
                                    Re-Summarize
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Viewer Modal */}
      {viewingSummary && (
        <div className="fixed inset-0 z-50 overflow-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={closeSummaryViewer}
                  className="bg-white rounded-full p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Close</span>
                  <IoClose className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                    <IoSparkles className="h-5 w-5 mr-2 text-indigo-200" />
                    AI Summary: {viewingSummary.name}
                  </h3>
                  
                  {viewingSummary.summarized && (
                    <div className="flex items-center mt-2 sm:mt-0 space-x-2">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="bg-white/20 text-white border border-white/30 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="ar">Arabic</option>
                      </select>
                      
                      <button
                        onClick={() => translateSummary(viewingSummary, selectedLanguage)}
                        disabled={isTranslating || selectedLanguage === viewingSummary.detectedLanguage}
                        className={`flex items-center text-sm rounded-lg px-3 py-1 ${
                          isTranslating || selectedLanguage === viewingSummary.detectedLanguage
                            ? 'bg-white/10 text-white/50 cursor-not-allowed'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        } transition-colors`}
                      >
                        <BsTranslate className="mr-1.5" />
                        {isTranslating && translatingCourseId === viewingSummary._id 
                          ? 'Translating...' 
                          : 'Translate'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex border-b border-gray-200">
                <div className="px-6 py-3 sm:px-8">
                  <button
                    onClick={() => {
                      closeSummaryViewer();
                      viewCourse(viewingSummary);
                    }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <IoDocument className="h-4 w-4 mr-1.5" />
                    View Original Document
                  </button>
                </div>
              </div>
              
              {/* Scrollable content area */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <div className="px-6 py-6 sm:px-8 sm:py-8">
                  <article className="prose prose-indigo max-w-none">
                    {/* Determine which summary to show */}
                    {(() => {
                      // Get translated summary if available
                      const translatedSummary = viewingSummary.translations?.[selectedLanguage]?.summary;
                      
                      // Use original summary as fallback
                      const summaryToShow = (selectedLanguage === viewingSummary.detectedLanguage || !translatedSummary)
                        ? viewingSummary.summary
                        : translatedSummary;
                      
                      // Render the summary
                      return summaryToShow.split('\n').map((line, i) => (
                        line.startsWith('##') ? (
                          <h2 key={i} className="text-xl sm:text-2xl font-bold mt-6 mb-3 pb-2 text-gray-800 border-b border-gray-200">
                            {line.replace('##', '').trim()}
                          </h2>
                        ) : line.startsWith('•') ? (
                          <div key={i} className="flex items-start mb-2 pl-2">
                            <span className="text-indigo-500 mr-2 font-bold">•</span>
                            <p className="my-0 text-gray-700">{line.substring(1).trim()}</p>
                          </div>
                        ) : (
                          <p key={i} className={`${line.trim() === '' ? 'my-4' : 'my-2'} text-gray-700`}>{line}</p>
                        )
                      ));
                    })()}
                  </article>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200 bg-gray-50 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <IoCalendar className="h-4 w-4 mr-2 text-indigo-500" />
                        <span>Generated on: {viewingSummary.summaryDate ? new Date(viewingSummary.summaryDate).toLocaleString() : 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <IoSparkles className="h-4 w-4 mr-2 text-indigo-500" />
                        <span>Summary type: {viewingSummary.summaryType === 'ai' ? 'AI-powered' : 'Text extraction'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Viewer Modal */}
      {viewingCourse && (
        <CourseViewer course={viewingCourse} onClose={closeViewer} />
      )}

      {/* Summarize Options Modal */}
      {showSummarizeOptions && courseForSummarization && (
        <SummarizeOptionsModal
          course={courseForSummarization}
          onClose={() => {
            setShowSummarizeOptions(false);
            setCourseForSummarization(null);
          }}
          onSubmit={generateSummary}
        />
      )}
    </div>
  );
}