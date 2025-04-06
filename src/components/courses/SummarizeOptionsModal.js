import { useState } from 'react';
import { IoClose, IoSparkles, IoSchool, IoListSharp, IoFileTray, IoHelp, IoTimeOutline, IoEarth } from 'react-icons/io5';

export default function SummarizeOptionsModal({ course, onClose, onSubmit }) {
  const [summarizeOptions, setSummarizeOptions] = useState({
    style: 'comprehensive', // comprehensive, concise, bullets
    focusAreas: [], // concepts, definitions, examples, applications
    includeQuestions: true,
    length: 'medium', // short, medium, long
    languageLevel: 'advanced', // beginner, intermediate, advanced
    outputLanguage: 'en' // Default to English
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOptionChange = (option, value) => {
    setSummarizeOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  const handleFocusAreaToggle = (area) => {
    setSummarizeOptions(prev => {
      const newAreas = prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area];
      
      return {
        ...prev,
        focusAreas: newAreas
      };
    });
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(course._id, summarizeOptions);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center">
            <IoSparkles className="h-5 w-5 mr-2 text-indigo-200" />
            Advanced Summarization Options
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <IoSchool className="h-5 w-5 mr-2 text-indigo-500" />
              Summarizing: {course.name}
            </h4>
            <p className="text-gray-600">
              Customize how this document is summarized to enhance your learning experience.
            </p>
          </div>
          
          {/* Options */}
          <div className="space-y-6">
            {/* Summarization Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summarization Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.style === 'comprehensive'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('style', 'comprehensive')}
                >
                  Comprehensive
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.style === 'concise'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('style', 'concise')}
                >
                  Concise
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.style === 'bullets'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('style', 'bullets')}
                >
                  Bullet Points
                </button>
              </div>
            </div>
            
            {/* Output Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <IoEarth className="h-4 w-4 mr-1.5 text-indigo-500" />
                Output Language
              </label>
              <select
                value={summarizeOptions.outputLanguage}
                onChange={(e) => handleOptionChange('outputLanguage', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              <p className="mt-1 text-xs text-gray-500">
                Select the language you want your summary to be generated in
              </p>
            </div>
            
            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Areas (select multiple)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input
                    id="focus-concepts"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={summarizeOptions.focusAreas.includes('concepts')}
                    onChange={() => handleFocusAreaToggle('concepts')}
                  />
                  <label htmlFor="focus-concepts" className="ml-2 block text-sm text-gray-700">
                    Key Concepts
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="focus-definitions"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={summarizeOptions.focusAreas.includes('definitions')}
                    onChange={() => handleFocusAreaToggle('definitions')}
                  />
                  <label htmlFor="focus-definitions" className="ml-2 block text-sm text-gray-700">
                    Important Definitions
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="focus-examples"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={summarizeOptions.focusAreas.includes('examples')}
                    onChange={() => handleFocusAreaToggle('examples')}
                  />
                  <label htmlFor="focus-examples" className="ml-2 block text-sm text-gray-700">
                    Practical Examples
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="focus-applications"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={summarizeOptions.focusAreas.includes('applications')}
                    onChange={() => handleFocusAreaToggle('applications')}
                  />
                  <label htmlFor="focus-applications" className="ml-2 block text-sm text-gray-700">
                    Real-world Applications
                  </label>
                </div>
              </div>
            </div>
            
            {/* Include Study Questions */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Include Study Questions
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="includeQuestions"
                    id="includeQuestions"
                    checked={summarizeOptions.includeQuestions}
                    onChange={() => handleOptionChange('includeQuestions', !summarizeOptions.includeQuestions)}
                    className="sr-only peer"
                  />
                  <div className="h-6 bg-gray-200 rounded-full w-11 peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-500 after:absolute after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:top-[2px] after:left-[2px] after:transition-all peer-checked:after:translate-x-full cursor-pointer"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Add test-yourself questions at the end of the summary
              </p>
            </div>
            
            {/* Summary Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Length
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.length === 'short'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('length', 'short')}
                >
                  Short
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.length === 'medium'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('length', 'medium')}
                >
                  Medium
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.length === 'long'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('length', 'long')}
                >
                  Detailed
                </button>
              </div>
            </div>
            
            {/* Language Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.languageLevel === 'beginner'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('languageLevel', 'beginner')}
                >
                  Beginner
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.languageLevel === 'intermediate'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('languageLevel', 'intermediate')}
                >
                  Intermediate
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    summarizeOptions.languageLevel === 'advanced'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleOptionChange('languageLevel', 'advanced')}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <IoSparkles className="h-4 w-4 mr-1.5" />
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}