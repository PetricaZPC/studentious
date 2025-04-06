import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { courseId, targetLanguage } = req.body;
  
  if (!courseId || !targetLanguage) {
    return res.status(400).json({ message: 'Course ID and target language are required' });
  }

  // Validate language code format
  if (!/^[a-z]{2,5}$/.test(targetLanguage)) {
    return res.status(400).json({ message: 'Invalid language code format' });
  }

  try {
    // Check API key first to fail fast
    if (!process.env.GEMINI_AI_API_KEY) {
      console.error('Missing Gemini API key for translation');
      return res.status(500).json({ message: 'Translation service not configured properly' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const coursesCollection = db.collection('courses');

    // Find the course
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.summary) {
      return res.status(400).json({ message: 'Course has no summary to translate' });
    }

    // Check if we already have this translation cached
    if (course.translations && course.translations[targetLanguage]) {
      return res.status(200).json({
        message: 'Using cached translation',
        translatedSummary: course.translations[targetLanguage].summary,
        fromCache: true
      });
    }

    // Initialize the Gemini API with the updated configuration
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
    
    // Use the correct model name and version (updated from v1beta)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Language mapping to full names
    const languageMap = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };
    
    const languageName = languageMap[targetLanguage] || targetLanguage;
    
    const prompt = `Translate the following document summary to ${languageName}. 
    Maintain all formatting including:
    - Headings that start with ## (keep the ## symbols)
    - Bullet points that start with •
    - Paragraph breaks and spacing
    
    Ensure the translation is accurate and professional. Preserve all information from the original text.
    
    Text to translate:
    ${course.summary}`;
    
    try {
      // Generate the content with proper error handling
      const result = await model.generateContent(prompt);
      
      if (!result || !result.response) {
        throw new Error('Invalid response from Gemini API');
      }
      
      const translatedText = result.response.text();
      if (!translatedText || translatedText.trim().length === 0) {
        throw new Error('Empty translation generated');
      }
      
      // Save the translated summary
      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { 
          $set: { 
            [`translations.${targetLanguage}`]: {
              summary: translatedText,
              timestamp: new Date()
            }
          }
        }
      );
      
      return res.status(200).json({
        message: 'Summary translated successfully',
        translatedSummary: translatedText
      });
    } catch (translationError) {
      console.error('Translation error:', translationError);
      return res.status(500).json({ 
        message: 'Translation failed', 
        error: translationError.message 
      });
    }
  } catch (error) {
    console.error('Error translating summary:', error);
    return res.status(500).json({ 
      message: 'Translation failed', 
      error: error.message
    });
  }
}