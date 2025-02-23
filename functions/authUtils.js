const { auth } = require('auth0');

// Configure Auth0 client
const auth0 = new auth.AuthenticationClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID
});

async function verifyToken(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Unauthorized');
    
    try {
        const result = await auth0.getProfile(token);
        return result;
    } catch (error) {
        throw new Error('Invalid token');
    }
}

module.exports = { verifyToken };
