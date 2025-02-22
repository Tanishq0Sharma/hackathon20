// functions/authUtils.js
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Configure JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

// Convert callback-based functions to promises
const getSigningKey = promisify(client.getSigningKey);
const verifyToken = promisify(jwt.verify);

module.exports.verifyToken = async (event) => {
  try {
    // Extract token from headers
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token missing');

    // Decode token header to get kid
    const decodedHeader = jwt.decode(token, { complete: true })?.header;
    if (!decodedHeader?.kid) throw new Error('Invalid token format');

    // Get signing key from JWKS
    const key = await getSigningKey(decodedHeader.kid);
    const publicKey = key.getPublicKey();

    // Verify token signature and claims
    const decoded = await verifyToken(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      audience: process.env.AUTH0_CLIENT_ID
    });

    // Return essential user information
    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.nickname
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }
};
