/**
 * Returns the HTML content for the welcome email.
 *
 * @param {string} displayName - The display name of the new user.
 * @returns {string} HTML string.
 */
export function getWelcomeEmailTemplate(displayName) {
  const safeName = displayName || 'Learner';

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <h1 style="color: #111;">Welcome to Studentious, ${safeName}!</h1>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        We're excited to have you on board. Start exploring courses, joining
        chatrooms, and collaborating with other learners.
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        If you have any questions, feel free to reply to this email.
      </p>
      <p style="color: #777; font-size: 14px; line-height: 1.5;">
        — The Studentious Team
      </p>
    </div>
  `;
}
