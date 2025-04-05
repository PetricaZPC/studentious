import clientPromise from '../auth/mongodb';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('accounts');

    const users = await db.collection('users').find({
      email: { $exists: true }
    }).toArray();

    const events = await db.collection('events')
      .find({
        date: { $gte: new Date().toISOString() }
      })
      .limit(5)
      .toArray();

    if (!events.length) {
      return res.status(200).json({ message: 'No upcoming events to recommend' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const results = await Promise.all(users.map(async (user) => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: user.email,
          subject: 'Your Personalized Event Recommendations',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Hello ${user.name || user.email}!</h2>
              <p>Here are some upcoming events you might be interested in:</p>
              
              ${events.map(event => `
                <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #F3F4F6;">
                  <h3 style="color: #1F2937; margin: 0 0 10px 0;">${event.title}</h3>
                  <p style="color: #6B7280;">${event.description}</p>
                  <p style="color: #4B5563; font-size: 14px;">
                    📅 ${new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              `).join('')}
              
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/calendar" 
                 style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                View Calendar
              </a>
            </div>
          `
        });
        return { user: user.email, status: 'success' };
      } catch (error) {
        return { user: user.email, status: 'failed', error: error.message };
      }
    }));

    return res.status(200).json({ 
      message: 'Recommendations sent',
      results 
    });

  } catch (error) {
    console.error('Error sending recommendations:', error);
    return res.status(500).json({ error: error.message });
  }
}