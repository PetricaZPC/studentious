import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import path from 'path';
import os from 'os';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Add API configuration to prevent timeouts for longer summaries
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
    externalResolver: true, // Increases timeout limit
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { courseId, options = {} } = req.body;
  if (!courseId) {
    return res.status(400).json({ message: 'Course ID is required' });
  }

  // Default options if not provided
  const summarizeOptions = {
    style: options.style || 'comprehensive',
    focusAreas: options.focusAreas || [],
    includeQuestions: options.includeQuestions !== undefined ? options.includeQuestions : true,
    length: options.length || 'medium',
    languageLevel: options.languageLevel || 'advanced'
  };

  // Extract the output language option
  const outputLanguage = options.outputLanguage || 'en';

  try {
    const client = await clientPromise;
    const db = client.db('accounts');
    const coursesCollection = db.collection('courses');

    // Find the course
    console.log(`Looking for course with ID: ${courseId}`);
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      console.error(`Course not found with ID: ${courseId}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log(`Found course: ${course.name}, stored file: ${course.storedFileName || 'not available'}`);

    // Determine file path
    let filePath;
    if (course.storedFilePath) {
      filePath = course.storedFilePath;
    } else if (course.storedFileName) {
      filePath = path.join(process.cwd(), 'public', 'uploads', 'courses', course.storedFileName);
    } else {
      return res.status(400).json({ 
        message: 'Course is missing file reference', 
        detail: 'The file information for this course cannot be found'
      });
    }

    // Verify the file exists
    try {
      await fsPromises.access(filePath);
      console.log(`File found at: ${filePath}`);
    } catch (fileError) {
      console.error(`File not found at path: ${filePath}`);
      return res.status(404).json({ 
        message: 'The course file could not be found. It may have been deleted or corrupted. Please try re-uploading the file.',
        detail: 'File not found in the storage location'
      });
    }

    // Read the file based on type
    let text = '';
    try {
      if (course.fileType === 'pdf') {
        const dataBuffer = await fsPromises.readFile(filePath);
        const pdfData = await pdf(dataBuffer);
        text = pdfData.text;
      } else if (['doc', 'docx'].includes(course.fileType)) {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
      } else {
        return res.status(400).json({ 
          message: `Unsupported file type: ${course.fileType}`,
          supportedTypes: ['pdf', 'doc', 'docx']
        });
      }
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'No text could be extracted from the file' });
      }
      
      console.log(`Successfully extracted ${text.length} characters from file`);
    } catch (textError) {
      console.error('Text extraction error:', textError);
      return res.status(500).json({ 
        message: 'Error extracting text from file', 
        error: textError.message 
      });
    }

    // Truncate text only if extremely long
    const truncatedText = text.length > 25000 ? text.slice(0, 25000) + '...' : text;

    // Check if API key is properly set
    if (!process.env.GEMINI_AI_API_KEY) {
      console.error('Gemini API key not set');
      return res.status(500).json({ 
        message: 'AI service not configured',
        details: 'Gemini API key is missing'
      });
    }

    // Update language detection logic to respect the requested output language
    let detectedLanguage = outputLanguage;
    let originalLanguage = "en";
    
    try {
      // Still detect original language for informational purposes
      originalLanguage = await detectDocumentLanguage(truncatedText);
      console.log(`Detected document language: ${originalLanguage}, generating summary in: ${outputLanguage}`);
    } catch (error) {
      console.error('Language detection error:', error);
      // Continue with requested language as default
    }
    
    // Build a more specific prompt based on the options
    let promptTemplate = '';

    switch (summarizeOptions.style) {
      case 'comprehensive':
        promptTemplate = `Create a detailed academic summary of the following document. 
        Provide thorough coverage of all main concepts, arguments, and evidence.`;
        break;
      case 'concise':
        promptTemplate = `Create a concise, focused summary of the following document.
        Concentrate only on the most essential information and key takeaways.`;
        break;
      case 'bullets':
        promptTemplate = `Create a bulleted summary of the following document.
        Use clear hierarchical bullet points to organize the information with main points and sub-points.`;
        break;
    }

    // Add length modifier
    switch (summarizeOptions.length) {
      case 'short':
        promptTemplate += `\nKeep the summary brief and focused (around 500 words).`;
        break;
      case 'medium':
        promptTemplate += `\nProvide a moderate-length summary (around 1000 words).`;
        break;
      case 'long':
        promptTemplate += `\nCreate a comprehensive, detailed summary (1500+ words).`;
        break;
    }

    // Add language level modifier
    switch (summarizeOptions.languageLevel) {
      case 'beginner':
        promptTemplate += `\nUse simple language accessible to beginners in this subject. Define technical terms and avoid complex jargon.`;
        break;
      case 'intermediate':
        promptTemplate += `\nUse moderately advanced language suitable for someone with basic knowledge of the subject. Briefly explain specialized terminology.`;
        break;
      case 'advanced':
        promptTemplate += `\nUse advanced academic language appropriate for specialists in this field. Technical terms can be used without extensive explanation.`;
        break;
    }

    // Add focus areas
    if (summarizeOptions.focusAreas.length > 0) {
      promptTemplate += `\n\nSpecial focus areas for this summary:`;
      if (summarizeOptions.focusAreas.includes('concepts')) {
        promptTemplate += `\n- Pay extra attention to identifying and explaining key theoretical concepts`;
      }
      if (summarizeOptions.focusAreas.includes('definitions')) {
        promptTemplate += `\n- Highlight important definitions and terminology, formatted in bold`;
      }
      if (summarizeOptions.focusAreas.includes('examples')) {
        promptTemplate += `\n- Include practical examples that illustrate key points`;
      }
      if (summarizeOptions.focusAreas.includes('applications')) {
        promptTemplate += `\n- Emphasize real-world applications and practical implications`;
      }
    }

    // Add study questions if requested
    if (summarizeOptions.includeQuestions) {
      promptTemplate += `\n\nAfter the main summary, please include a "Study Questions" section with 5-7 thoughtful questions that test understanding of the key concepts.`;
    }

    // Add formatting instructions
    promptTemplate += `\n\nFormat the summary with:
    - Use ## for section headings
    - Use bold for important terms and concepts
    - Use • for bullet points
    - Include proper paragraph spacing
    - Start with an "Overview" section

    Document content:
    ${text}`;

    // Update the prompt template to include the language instruction
    promptTemplate += `\n\nPlease generate the summary in ${getLanguageName(outputLanguage)} language.`;

    // Helper function to get full language name
    function getLanguageName(languageCode) {
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
      
      return languageMap[languageCode] || languageCode;
    }

    // Generate detailed summary in English
    let summary = '';
    let summaryType = 'extraction';
    
    try {
      summary = await generateComprehensiveSummary(promptTemplate);
      summaryType = 'ai';
    } catch (error) {
      console.error('Error with AI summarization:', error);
      // Fallback to basic summarization
      try {
        summary = generateEnhancedSummary(truncatedText);
      } catch (fallbackError) {
        console.error('Fallback summarization also failed:', fallbackError);
        return res.status(500).json({ 
          message: 'Failed to generate summary', 
          error: error.message,
          fallbackError: fallbackError.message
        });
      }
    }

    // Update the course with the summary
    try {
      await coursesCollection.updateOne(
        { _id: new ObjectId(courseId) },
        { $set: { 
          summary, 
          summarized: true,
          summaryType,
          summaryDate: new Date(),
          detectedLanguage: outputLanguage,
          originalLanguage
        }}
      );
    } catch (dbError) {
      console.error('Database update error:', dbError);
      // Still return the summary but note the DB error
      return res.status(200).json({ 
        message: 'Summary generated but not saved',
        warning: 'Failed to update database',
        summary,
        detectedLanguage: outputLanguage
      });
    }
    
    return res.status(200).json({ 
      message: 'Summary generated successfully',
      summary,
      detectedLanguage: outputLanguage
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return res.status(500).json({ 
      message: 'Summary generation failed', 
      error: error.message
    });
  }
}

// Detect document language using Gemini
async function detectDocumentLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Empty text provided for language detection');
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Take sample for language detection
    const sampleText = text.slice(0, 1000);
    
    const prompt = `Analyze the following text and determine what language it is written in. 
    Respond with only the ISO language code (e.g., "en" for English, "fr" for French, etc.).
    
    Text: "${sampleText}"`;
    
    const result = await model.generateContent(prompt);
    if (!result || !result.response) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const languageCode = result.response.text().trim();
    
    // Validate the language code format
    if (!languageCode || languageCode.length > 5) {
      console.warn('Invalid language code detected:', languageCode);
      return 'en';
    }
    
    return languageCode;
  } catch (error) {
    console.error('Language detection error:', error);
    throw new Error(`Language detection failed: ${error.message}`);
  }
}

// Comprehensive summary generator
async function generateComprehensiveSummary(promptTemplate) {
  if (!promptTemplate || typeof promptTemplate !== 'string' || promptTemplate.trim().length < 10) {
    throw new Error('Prompt too short or invalid for summarization');
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(promptTemplate);
    if (!result || !result.response) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const summaryText = result.response.text();
    if (!summaryText || summaryText.trim().length === 0) {
      throw new Error('Empty summary generated');
    }
    
    return summaryText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`AI summarization failed: ${error.message}`);
  }
}

// Enhanced text extraction-based summarization (backup method)
function generateEnhancedSummary(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text provided for summarization');
  }
  
  // Extract key sentences and paragraphs
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    throw new Error('No sentences found in the text');
  }
  
  // Take first sentences as a summary, more than before
  let basicSummary = sentences.slice(0, 20).join(' ');
  
  // If too short, grab more content
  if (basicSummary.length < 1000 && sentences.length > 20) {
    basicSummary = sentences.slice(0, 40).join(' ');
  }
  
  // Add some structure
  return `## Summary\n\n${basicSummary}\n\n## Key Points\n\n• This is an automatically extracted summary.\n• For better results, please try regenerating the summary.`;
}