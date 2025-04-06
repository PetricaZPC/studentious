import { ObjectId } from 'mongodb';
import clientPromise from '../../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fileId } = req.query;
    
    if (!fileId || !ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    
    // Get file metadata
    const filesCollection = db.collection('courses.files');
    const file = await filesCollection.findOne({ _id: new ObjectId(fileId) });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Create bucket
    const bucket = new mongodb.GridFSBucket(db, {
      bucketName: 'courses'
    });
    
    // Set content type header
    res.setHeader('Content-Type', file.metadata?.contentType || 'application/octet-stream');
    
    // Check if download parameter is set
    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    }
    
    // Stream file to response
    bucket.openDownloadStream(new ObjectId(fileId)).pipe(res);
    
  } catch (error) {
    console.error('Error retrieving file:', error);
    return res.status(500).json({ message: 'Error retrieving file' });
  }
}