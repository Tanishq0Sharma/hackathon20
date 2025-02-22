const { AuthenticationClient } = require('auth0');

const auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
});

async function verifyToken(event) {
  const token = event.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Missing authorization token');
  }

  try {
    // Verify token and get user profile
    const profile = await auth0.getProfile(token);
    
    // Return both sub and entire profile if needed
    return {
      sub: profile.sub,
      email: profile.email,
      name: profile.name
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}
