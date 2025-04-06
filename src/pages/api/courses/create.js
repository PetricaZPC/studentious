import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user session
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Parse form data
    let fields, files;
    try {
      const form = new IncomingForm({
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
      });
      
      ({ fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Form parsing error:', err);
            reject(err);
            return;
          }
          resolve({ fields, files });
        });
      }));
    } catch (formError) {
      console.error('Error parsing form:', formError);
      return res.status(500).json({ message: 'Failed to parse form data', error: formError.message });
    }

    // Validate inputs
    const name = fields.name?.[0];
    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Create directory for uploads if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (mkdirError) {
      console.error('Error creating directory:', mkdirError);
      return res.status(500).json({ message: 'Failed to create directory', error: mkdirError.message });
    }

    // Create a unique filename to avoid collisions
    const fileExtension = path.extname(file.originalFilename).substring(1);
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Copy the file to the uploads directory
    try {
      await fs.promises.copyFile(file.filepath, filePath);
      console.log(`File saved to: ${filePath}`);
    } catch (copyError) {
      console.error('Error copying file:', copyError);
      return res.status(500).json({ message: 'Failed to copy file', error: copyError.message });
    }

    // Store course information in the database
    const coursesCollection = db.collection('courses');
    
    const courseData = {
      name,
      description: fields.description?.[0] || '',
      fileUrl: `/uploads/courses/${uniqueFilename}`,
      fileName: file.originalFilename,
      fileType: fileExtension,
      storedFileName: uniqueFilename,
      storedFilePath: filePath.replace(/\\/g, '/'), // Normalize path for cross-platform
      uploadedBy: user.email,
      uploaderName: user.fullName || user.email,
      userId: user._id.toString(),
      createdAt: new Date(),
      summarized: false,
      isPublic: fields.isPublic?.[0] === 'true'
    };

    // Insert course data
    let result;
    try {
      result = await coursesCollection.insertOne(courseData);
      console.log('Course created with ID:', result.insertedId.toString());
      console.log('File stored at:', filePath);
    } catch (dbError) {
      console.error('Error inserting course data:', dbError);
      return res.status(500).json({ message: 'Failed to insert course data', error: dbError.message });
    }

    // Clean up temporary file
    try {
      await fs.promises.unlink(file.filepath);
    } catch (unlinkError) {
      console.warn('Error unlinking temporary file:', unlinkError);
    }

    return res.status(201).json({ 
      message: 'Course uploaded successfully', 
      courseId: result.insertedId.toString(),
      fileType: fileExtension,
      storedFileName: uniqueFilename
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}