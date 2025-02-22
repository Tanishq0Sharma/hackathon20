// functions/authUtils.js
const { AuthenticationClient } = require('auth0');

// Configure Auth0 client
const auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
});

/**
 * Verifies the JWT token and extracts user information.
 * @param {Object} event - The Netlify function event object.
 * @returns {Object} - User information including `sub` (user ID) and `name`.
 * @throws {Error} - If the token is invalid or missing.
 */
async function verifyToken(event) {
  // Extract token from headers
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Authorization token is missing');
  }

  try {
    // Verify the token and get user profile
    const profile = await auth0.getProfile(token);

    // Return essential user information
    return {
      sub: profile.sub, // Unique user ID from Auth0
      name: profile.name || profile.nickname || 'Anonymous', // Fallback for missing names
      email: profile.email // Optional: Include email if needed
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);

    // Handle specific Auth0 errors
    if (error.message.includes('Invalid token')) {
      throw new Error('Invalid or expired token');
    }
    if (error.message.includes('Unauthorized')) {
      throw new Error('Unauthorized access');
    }

    // Generic error for other cases
    throw new Error('Failed to verify token');
  }
}

module.exports = { verifyToken };
