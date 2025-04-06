import { sendScheduledEmails } from '../../utils/emailScheduler';

// Schedule the email sending
const scheduleEmails = () => {
  // Run every Monday and Thursday at 10 AM
  const schedule = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const hour = now.getHours();
    
    // Check if it's Monday (1) or Thursday (4) at 10 AM
    if ((dayOfWeek === 1 || dayOfWeek === 4) && hour === 10) {
      sendScheduledEmails().catch(console.error);
    }
  };

  // Check every hour
  setInterval(schedule, 1000 * 60 * 60);
  
  // Also run schedule check immediately
  schedule();
};

// Start scheduling if we're on the server
if (typeof window === 'undefined') {
  scheduleEmails();
}