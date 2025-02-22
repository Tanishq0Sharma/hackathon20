const { AuthenticationClient } = require('auth0');

const auth0 = new AuthenticationClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET
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
