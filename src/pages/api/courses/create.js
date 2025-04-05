import clientPromise from '../auth/mongodb';
import { IncomingForm } from 'formidable';
import { createReadStream } from 'fs';
import { GridFSBucket } from 'mongodb';
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

    // Parse form data
    const form = new IncomingForm();
    
    // Parse form and wait for completion
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const name = fields.name[0];
    const description = fields.description ? fields.description[0] : '';
    
    if (!file || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get file details
    const fileType = file.originalFilename.split('.').pop().toLowerCase();
    
    // Save file to GridFS
    const bucket = new GridFSBucket(db);
    const uploadStream = bucket.openUploadStream(file.originalFilename, {
      metadata: {
        uploadedBy: user.email,
        contentType: file.mimetype,
      }
    });
    
    const fileId = uploadStream.id;
    
    // Create readable stream from file and pipe to upload stream
    const readStream = createReadStream(file.filepath);
    
    await new Promise((resolve, reject) => {
      readStream.pipe(uploadStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    // Create file URL
    const fileUrl = `/api/courses/download/${fileId}`;
    
    // Save course to MongoDB
    const coursesCollection = db.collection('courses');
    const courseData = {
      name,
      description,
      fileUrl,
      fileName: file.originalFilename,
      fileType,
      fileId: fileId.toString(),
      uploadedBy: user.email,
      uploaderName: user.fullName || user.email,
      createdAt: new Date(),
      summarized: false,
      summary: ''
    };
    
    const result = await coursesCollection.insertOne(courseData);
    
    return res.status(201).json({
      message: 'Course created successfully',
      courseId: result.insertedId.toString(),
      fileUrl,
      fileType
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}