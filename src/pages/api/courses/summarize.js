import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';
import { GridFSBucket } from 'mongodb';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import os from 'os';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user from session
    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { courseId, fileUrl } = req.body;
    
    if (!courseId || !fileUrl) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Get the course
    const coursesCollection = db.collection('courses');
    const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Extract fileId from the URL
    const fileIdStr = course.fileId;
    const fileId = new ObjectId(fileIdStr);
    
    // Download the file to a temporary location
    const bucket = new GridFSBucket(db);
    const downloadStream = bucket.openDownloadStream(fileId);
    
    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = join(tempDir, `${fileId.toString()}.${course.fileType}`);
    const writeStream = createWriteStream(tempFilePath);
    
    await pipeline(downloadStream, writeStream);
    
    // Extract text based on file type
    let text = '';
    
    if (course.fileType === 'pdf') {
      const pdfBuffer = await fsPromises.readFile(tempFilePath);
      const pdfData = await pdf(pdfBuffer);
      text = pdfData.text;
    } else if (['doc', 'docx'].includes(course.fileType)) {
      const result = await mammoth.extractRawText({ path: tempFilePath });
      text = result.value;
    }
    
    // Truncate text if too long
    const truncatedText = text.slice(0, 15000) + (text.length > 15000 ? '...' : '');

    // Try to use an AI service for summarization
    let summary = '';
    try {
      // Try to use Gemini if API key exists - UPDATED to match your .env file
      if (process.env.GEMINI_AI_API_KEY) {
        summary = await generateGeminiSummary(truncatedText);
      } else {
        // Fallback to enhanced text extraction
        summary = generateEnhancedSummary(truncatedText);
      }
    } catch (error) {
      console.error('Error with AI summarization:', error);
      // Fallback to enhanced text extraction
      summary = generateEnhancedSummary(truncatedText);
    }

    // Update the course with the summary
    await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { 
        summary, 
        summarized: true,
        summaryType: process.env.GEMINI_AI_API_KEY ? 'ai' : 'extraction',
        summaryDate: new Date()
      }}
    );
    
    // Clean up temporary file
    await fsPromises.unlink(tempFilePath);
    
    return res.status(200).json({ 
      message: 'Summary generated successfully',
      summary 
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Attempt to use Gemini - Updated to use your env var
async function generateGeminiSummary(text) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Please provide a comprehensive summary of the following document. 
    Identify the main topics, key points, and important conclusions.
    Organize the summary with clear sections and bullet points where appropriate.
    Structure it with Introduction, Key Points, and Conclusion sections.
    
    Document content:
    ${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('AI summarization failed');
  }
}

// Enhanced text extraction-based summarization (no changes needed here)
function generateEnhancedSummary(text) {
  // The function implementation remains the same...
  if (!text || text.trim().length === 0) {
    return "No content available to summarize.";
  }

  // Normalize text - remove extra spaces, line breaks
  const normalizedText = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Extract sentences more accurately with regex
  const sentences = normalizedText
    .replace(/([.!?])\s+(?=[A-Z])/g, "$1|")
    .split("|")
    .filter(s => s.trim().length > 15)
    .map(s => s.trim());

  if (sentences.length < 5) {
    return normalizedText.slice(0, 500) + "...";
  }

  // Calculate sentence importance based on word frequency
  const wordFrequency = {};
  sentences.forEach(sentence => {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      if (word.length > 3) { // Ignore short words
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
  });

  // Score sentences by summing the frequency of their words
  const sentenceScores = sentences.map(sentence => {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const score = words.reduce((total, word) => {
      return total + (wordFrequency[word] || 0);
    }, 0) / (words.length || 1); // Normalize by sentence length
    return { sentence, score };
  });

  // Get introduction (first 2 sentences)
  const introduction = sentences.slice(0, 2);
  
  // Get top-scoring sentences from the middle (excluding intro and conclusion)
  const middleSentences = sentenceScores
    .slice(2, -2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.sentence);
  
  // Get conclusion (last 2 sentences)
  const conclusion = sentences.slice(-2);
  
  // Combine all sections
  const summary = [
    "## Introduction",
    introduction.join(' '),
    "",
    "## Key Points",
    ...middleSentences.map(s => `• ${s}`),
    "",
    "## Conclusion",
    conclusion.join(' ')
  ].join('\n');
  
  return summary;
}