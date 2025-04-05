import clientPromise from '../../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const audioId = req.query.id;
    
    console.log('Audio request for ID:', audioId);
    
    if (!audioId || !ObjectId.isValid(audioId)) {
      console.error('Invalid audio ID format:', audioId);
      return res.status(400).json({ message: 'Invalid audio ID' });
    }
    
    const client = await clientPromise;
    const db = client.db('accounts');
    const audioCollection = db.collection('course_audio');
    
    console.log('Looking for audio document with ID:', audioId);
    const audioDoc = await audioCollection.findOne({ _id: new ObjectId(audioId) });
    
    if (!audioDoc) {
      console.error('Audio document not found for ID:', audioId);
      return res.status(404).json({ message: 'Audio not found' });
    }
    
    console.log('Found audio document, type:', typeof audioDoc.audio);
    
    // Set proper headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for up to a year
    
    // If this is a download request, add Content-Disposition header
    if (req.query.download === 'true') {
      const filename = audioDoc.title ? `${audioDoc.title}.mp3` : `audio-${audioId}.mp3`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Handle the audio buffer correctly
    if (!audioDoc.audio) {
      console.error('Audio document exists but contains no audio data');
      return res.status(500).json({ message: 'Audio data is missing' });
    }
    
    // Send appropriate response based on audio data format
    try {
      if (audioDoc.audio.buffer) {
        console.log('Sending audio from buffer property');
        res.end(audioDoc.audio.buffer);
      } 
      else if (Buffer.isBuffer(audioDoc.audio)) {
        console.log('Sending audio as direct Buffer');
        res.end(audioDoc.audio);
      }
      else if (typeof audioDoc.audio === 'object' && audioDoc.audio.type === 'Buffer') {
        console.log('Sending audio from object with Buffer type');
        res.end(Buffer.from(audioDoc.audio.data));
      }
      else {
        console.log('Converting audio with generic Buffer.from, type:', typeof audioDoc.audio);
        res.end(Buffer.from(audioDoc.audio));
      }
    } catch (bufferError) {
      console.error('Error processing audio buffer:', bufferError);
      return res.status(500).json({ message: 'Error processing audio data' });
    }
  } catch (error) {
    console.error('Error serving audio:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}