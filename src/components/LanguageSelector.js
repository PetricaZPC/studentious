import { useState, useEffect } from 'react';

export default function LanguageSelector({ onLanguageSelect, selectedLanguage, disabled }) {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Romanian' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageSelect(e.target.value)}
        disabled={disabled}
        className={`mt-1 block w-48 pl-3 pr-10 py-2 text-sm border rounded-md
          ${disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer'
          }`}
      >
        <option value="" disabled>Select Language</option>
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}