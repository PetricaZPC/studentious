import clientPromise from '../auth/mongodb';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ObjectId } from 'mongodb';
import { GridFSBucket } from 'mongodb';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import os from 'os';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

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
    
    // Truncate text if too long (Gemini has context limits)
    const truncatedText = text.slice(0, 15000) + (text.length > 15000 ? '...' : '');
    
    // Generate summary with Gemini
    const prompt = `Please summarize the following document content:
    
    ${truncatedText}
    
    Create a concise summary that captures the main ideas and important information.`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // Update the course with the summary
    await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { summary, summarized: true } }
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