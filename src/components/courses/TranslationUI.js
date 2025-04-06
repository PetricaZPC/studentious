import { useState } from 'react';
import { BsTranslate } from 'react-icons/bs';

export default function TranslationUI({ courseId, summary, detectedLanguage, onTranslated }) {
  const [selectedLanguage, setSelectedLanguage] = useState(detectedLanguage || 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  
  // Common languages list
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' }
  ];

  const translateSummary = async () => {
    if (selectedLanguage === detectedLanguage) {
      setError('Summary is already in this language');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setIsTranslating(true);
    setError('');
    
    try {
      console.log('Requesting translation to:', selectedLanguage);
      
      const response = await fetch('/api/courses/translate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId,
          targetLanguage: selectedLanguage 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Translation API error:', data);
        throw new Error(data.message || data.error || 'Failed to translate summary');
      }
      
      console.log('Translation successful');
      
      // Call the parent component's callback with the translated summary
      if (onTranslated) {
        onTranslated(data.translatedSummary, selectedLanguage);
      }
      
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'An error occurred during translation');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-2">
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
        disabled={isTranslating}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      
      <button
        onClick={translateSummary}
        disabled={isTranslating || selectedLanguage === detectedLanguage || !summary}
        className={`flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors ${
          isTranslating || selectedLanguage === detectedLanguage || !summary
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
        }`}
      >
        <BsTranslate className="mr-1.5" />
        {isTranslating ? 'Translating...' : 'Translate'}
      </button>
      
      {detectedLanguage && (
        <div className="text-xs text-gray-500">
          Original: {languages.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
        </div>
      )}
    </div>
  );
}