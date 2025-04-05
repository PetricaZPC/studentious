import clientPromise from '@/pages/api/auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
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

    const { courseId, text } = req.body;
    
    if (!courseId || !text) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Verify the course belongs to the user
    const coursesCollection = db.collection('courses');

    // First find the course by ID only
    const course = await coursesCollection.findOne({ 
      _id: new ObjectId(courseId)
    });

    // Then check ownership separately
    if (!course) {
      console.log('Course not found with ID:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check various possible ownership fields
    const isOwner = 
      course.uploadedBy === user.email || 
      course.userId === user._id.toString() ||
      course.userId === user.email ||
      course.userEmail === user.email ||
      course.owner === user.email;

    if (!isOwner) {
      console.log('Course found but user does not have permission');
      console.log('Course ownership info:', {
        courseUploadedBy: course.uploadedBy,
        userEmail: user.email,
        userId: user._id.toString()
      });
      return res.status(403).json({ message: 'You do not have permission to generate audio for this course' });
    }

    // Prepare text for conversion (limit length if needed)
    const maxTextLength = 5000; // ElevenLabs has limits on text length
    const trimmedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + "... (content trimmed for audio length)"
      : text;

    // Call ElevenLabs API
    // Use the dedicated ElevenLabs API key if available
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.GEMINI_AI_API_KEY;
    console.log('Using API Key starting with:', ELEVENLABS_API_KEY?.substring(0, 5) + '...');
    const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Default voice - Rachel
    
    let audioBuffer;
    try {
      console.log('Calling ElevenLabs API...');
      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text: trimmedText,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (!elevenLabsResponse.ok) {
        let errorMessage = `ElevenLabs API error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText}`;
        let errorDetails = {};
        
        try {
          errorDetails = await elevenLabsResponse.json();
          console.error('ElevenLabs API error details:', errorDetails);
        } catch (jsonError) {
          console.error('Could not parse ElevenLabs error response:', jsonError);
        }
        
        return res.status(elevenLabsResponse.status).json({ 
          message: errorMessage,
          details: errorDetails
        });
      }

      // Get the audio binary data as an ArrayBuffer
      const audioArrayBuffer = await elevenLabsResponse.arrayBuffer();
      if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
        console.error('Received empty audio data from ElevenLabs');
        return res.status(500).json({ message: 'Received empty audio data from ElevenLabs' });
      }
      
      console.log('Successfully received audio data, size:', audioArrayBuffer.byteLength, 'bytes');
      audioBuffer = Buffer.from(audioArrayBuffer);
    } catch (elevenLabsError) {
      console.error('Error calling ElevenLabs API:', elevenLabsError);
      return res.status(500).json({ 
        message: 'Error calling ElevenLabs API',
        error: elevenLabsError.message
      });
    }

    // Make sure we have audio data before continuing
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(500).json({ message: 'Failed to generate audio data' });
    }

    // Store the audio file in MongoDB
    const audioCollection = db.collection('course_audio');
    const audioDoc = {
      courseId: course._id.toString(),
      userId: user._id.toString(),
      audio: audioBuffer,
      contentType: 'audio/mpeg',
      title: `${course.name} - Audio`,
      description: 'AI generated audio podcast of course content',
      textLength: trimmedText.length,
      createdAt: new Date()
    };

    console.log('Storing audio in MongoDB...');
    const audioResult = await audioCollection.insertOne(audioDoc);

    // Update the course with reference to the audio
    await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { 
        $set: { 
          audioId: audioResult.insertedId.toString(),
          audioGeneratedAt: new Date()
        } 
      }
    );

    // Return a URL to the endpoint that will serve the audio
    const audioUrl = `/api/courses/audio/${audioResult.insertedId}`;
    
    return res.status(200).json({
      success: true,
      audioUrl,
      message: 'Audio podcast generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating audio:', error);
    return res.status(500).json({ 
      message: 'Internal server error generating audio',
      error: error.message
    });
  }
}