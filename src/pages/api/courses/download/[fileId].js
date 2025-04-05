import clientPromise from '../../auth/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fileId } = req.query;
    
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    
    // Create GridFS bucket
    const bucket = new GridFSBucket(db);
    
    // Find the file by ID
    const file = await db.collection('fs.files').findOne({ _id: new ObjectId(fileId) });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set Content-Type header based on file type
    res.setHeader('Content-Type', file.metadata.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    
    // Stream the file to the response
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}