import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate } from './emailTemplates';

export async function sendWelcomeEmail(userEmail, userName) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: 'Welcome to Studentious! 🎓',
      html: getWelcomeEmailTemplate(userName || userEmail.split('@')[0])
    });

    console.log(`Welcome email sent to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}