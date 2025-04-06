import { useState, useEffect } from 'react';
import { IoClose, IoDocument, IoDownload, IoWarning, IoOpenOutline } from 'react-icons/io5';

export default function CourseViewer({ course, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadTimeout, setLoadTimeout] = useState(null);
  
  useEffect(() => {
    // Reset state when a new course is selected
    if (course) {
      setIsLoading(true);
      setError('');
      
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          setError(`Document load timed out. Please try downloading the file instead.`);
          setIsLoading(false);
        }
      }, 15000); // 15 seconds timeout
      
      setLoadTimeout(timeout);
    }
    
    return () => {
      if (loadTimeout) clearTimeout(loadTimeout);
    };
  }, [course]);

  // Handle missing course
  if (!course) {
    return null;
  }

  // Determine the file type and viewability
  const fileType = course.fileType?.toLowerCase() || '';
  const isViewablePdf = fileType === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);
  
  // Ensure the URL is valid
  const viewUrl = course.fileUrl.startsWith('/') 
    ? `${window.location.origin}${course.fileUrl}`
    : course.fileUrl;

  // Open the document in a new tab/window
  const openInNewTab = () => {
    window.open(viewUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center">
            <IoDocument className="h-5 w-5 mr-2" />
            {course.name} 
            <span className="ml-2 text-sm opacity-80">({course.fileType?.toUpperCase() || 'Document'})</span>
          </h3>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={openInNewTab}
              className="text-white bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center"
            >
              <IoOpenOutline className="h-4 w-4 mr-1.5" />
              Open in New Tab
            </button>
            <a 
              href={viewUrl} 
              download={course.fileName}
              className="text-white bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center"
            >
              <IoDownload className="h-4 w-4 mr-1.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <IoClose className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-0 flex-grow overflow-hidden relative bg-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-indigo-600 font-medium">Loading document...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <IoWarning className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={openInNewTab}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <IoOpenOutline className="h-5 w-5 mr-2" />
                  Open in New Tab
                </button>
                <a 
                  href={viewUrl} 
                  download={course.fileName}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <IoDownload className="h-5 w-5 mr-2" />
                  Download File
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center">
              <div className="max-w-md text-center mb-8">
                <div className="bg-blue-50 rounded-full p-5 mb-4 inline-block">
                  <IoDocument className="h-16 w-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Document Ready
                </h3>
                <p className="text-gray-600 mb-6">
                  Use the buttons below to view the document in the best way for your device:
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={openInNewTab}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <IoOpenOutline className="h-5 w-5 mr-2" />
                    Open in New Tab
                  </button>
                  <a 
                    href={viewUrl} 
                    download={course.fileName}
                    className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <IoDownload className="h-5 w-5 mr-2" />
                    Download
                  </a>
                </div>
              </div>
              
              {/* Show a small preview for PDFs if possible */}
              {isViewablePdf && (
                <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden w-full max-w-lg mx-auto" style={{maxHeight: '300px'}}>
                  <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 text-sm text-gray-700 font-medium flex justify-between items-center">
                    <span>PDF Preview (first page)</span>
                    <button
                      onClick={openInNewTab}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View Full
                    </button>
                  </div>
                  <object
                    data={`${viewUrl}#page=1&view=FitH`}
                    type="application/pdf"
                    className="w-full h-64"
                    onLoad={() => setIsLoading(false)}
                  >
                    <p>Your browser doesn't support PDF previews.</p>
                  </object>
                </div>
              )}
              
              {/* Show image preview directly */}
              {isImage && (
                <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden w-full max-w-lg mx-auto">
                  <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 text-sm text-gray-700 font-medium">
                    Image Preview
                  </div>
                  <div className="p-4 flex justify-center">
                    <img 
                      src={viewUrl} 
                      alt={course.name}
                      className="max-w-full max-h-64 object-contain"
                      onLoad={() => setIsLoading(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}