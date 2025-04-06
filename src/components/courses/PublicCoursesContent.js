import { useState, useEffect } from 'react';
import { IoDocument, IoSparkles, IoWarning, IoCalendar, IoEye, IoSearch, IoClose } from 'react-icons/io5';
import { BsTranslate } from 'react-icons/bs';
import { useAuth } from '@/pages/api/context/AuthContext';

export default function PublicCoursesContent() {
  const { user } = useAuth();
  const [publicCourses, setPublicCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSummary, setViewingSummary] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingCourseId, setTranslatingCourseId] = useState(null);
  
  useEffect(() => {
    fetchPublicCourses();
  }, []);
  
  const fetchPublicCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/courses/public');
      
      if (!response.ok) {
        throw new Error('Failed to fetch public courses');
      }
      
      const data = await response.json();
      setPublicCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching public courses:', err);
      setError('Failed to load public courses');
    } finally {
      setIsLoading(false);
    }
  };
  
  const viewSummary = (course) => {
    setViewingSummary(course);
  };
  
  const closeSummaryViewer = () => {
    setViewingSummary(null);
  };
  
  const translateSummary = async (course, targetLanguage) => {
    if (!course.summary) {
      return;
    }
    
    if (targetLanguage === course.detectedLanguage) {
      return;
    }
    
    setIsTranslating(true);
    setTranslatingCourseId(course._id);
    
    try {
      const response = await fetch('/api/courses/translate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId: course._id,
          targetLanguage 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to translate summary');
      }
      
      // Update view state with the translated summary
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
      
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
      setTranslatingCourseId(null);
    }
  };
  
  // Filter courses by search query
  const filteredCourses = publicCourses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search public courses..."
          />
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <IoWarning className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-4 border-l-4 border-purple-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            <div className="absolute inset-4 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin" style={{animationDuration: '2s'}}></div>
          </div>
          <p className="mt-4 text-indigo-700 font-medium">Loading public courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="bg-gray-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoDocument className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">No Public Courses Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery ? 'Try a different search term' : 'There are no public courses available right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
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
                </div>
              </div>
              
              {/* Course Footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 flex items-center">
                      <IoCalendar className="h-3 w-3 mr-1.5" />
                      <span className="whitespace-nowrap">
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Unknown date'}
                      </span>
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Public
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewSummary(course)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors duration-200"
                    >
                      <IoEye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
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
                      
                      // Render the summary with formatting
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
    </div>
  );
}