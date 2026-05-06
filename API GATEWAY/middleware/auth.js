const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const secret = process.env.JWT_SECRET || 'your_jwt_secret';

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, secret, { algorithms: ['HS256'] }, (err, decoded) => {
        if (err) {
            logger.warn(`JWT Verification Failed: ${err.message}`);
            return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
        }

        // Inject user info into headers for downstream services
        req.user = decoded;
        req.headers['x-user-id'] = decoded.id;
        req.headers['x-user-role'] = decoded.role;
        
        next();
    });
};

module.exports = verifyJWT;
