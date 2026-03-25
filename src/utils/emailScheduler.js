import { CronJob } from 'cron';
import clientPromise from '../pages/api/auth/mongodb';
import nodemailer from 'nodemailer';

export async function sendScheduledEmails() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'studentious');

    // Get active users
    const users = await db.collection('users')
      .find({
        email: { $exists: true },
        active: true,
      })
      .toArray();

    if (!users.length) {
      return;
    }

    // Get upcoming events
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const events = await db.collection('events')
      .find({
        date: {
          $gte: new Date().toISOString(),
          $lte: nextWeek.toISOString()
        }
      })
      .sort({ date: 1 })
      .limit(5)
      .toArray();

    if (!events.length) {
      return;
    }

    // Configure email transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Verify connection
    await transporter.verify();

    // Send emails to each user
    for (const user of users) {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: user.email,
          subject: '🎉 Your Weekly Event Recommendations',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Hello ${user.name || user.email}!</h2>
              <p>Here are some exciting events coming up this week:</p>
              
              ${events.map(event => `
                <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #F3F4F6;">
                  <h3 style="color: #1F2937; margin: 0 0 10px 0;">${event.title}</h3>
                  <p style="color: #6B7280;">${event.description}</p>
                  <div style="color: #4B5563; font-size: 14px;">
                    📅 ${new Date(event.date).toLocaleDateString()}
                    ${event.time ? `<br>⏰ ${event.time}` : ''}
                    ${event.location ? `<br>📍 ${event.location}` : ''}
                  </div>
                </div>
              `).join('')}
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/calendar" 
                   style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                  View Full Calendar
                </a>
              </div>
            </div>
          `
        });

      } catch (error) {
        // Ignore failures for individual recipients
      }
    }
  } catch (error) {
    console.error('Error in sendScheduledEmails:', error);
    throw error;
  }
}