// Add this to your imports
import TranslationUI from './TranslationUI';

// Inside your component:
const [currentSummary, setCurrentSummary] = useState(course.summary || '');
const [currentLanguage, setCurrentLanguage] = useState(course.detectedLanguage || 'en');

// Add this handler
const handleTranslated = (translatedSummary, language) => {
  setCurrentSummary(translatedSummary);
  setCurrentLanguage(language);
};

// In your JSX:
{course.summarized && (
  <div className="bg-gray-50 rounded-lg p-4 mt-4">
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-lg">Summary</h3>
      
      <TranslationUI 
        courseId={course._id}
        summary={course.summary}
        detectedLanguage={course.detectedLanguage}
        onTranslated={handleTranslated}
      />
    </div>
    
    <div className="prose max-w-none whitespace-pre-wrap">
      {currentSummary || course.summary || 'No summary available.'}
    </div>
  </div>
)}