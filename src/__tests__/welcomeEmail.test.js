import { sendWelcomeEmail } from '../utils/sendWelcomeEmail';

describe('Welcome Email Tests', () => {
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    // Clear console logs before each test
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send welcome email successfully', async () => {
    const result = await sendWelcomeEmail(mockUser.email, mockUser.name);
    expect(result).toBe(true);
  });

  it('should handle missing name gracefully', async () => {
    const result = await sendWelcomeEmail(mockUser.email);
    expect(result).toBe(true);
  });
});