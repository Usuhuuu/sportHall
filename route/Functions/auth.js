const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    // Authorization Header awna
    const token = req.headers.authorization?.split(' ')[1];  
    if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid or expired' });
        }
         //Save decoded user information in request
        req.user = decoded
        //next middleware
        next()
    });
};

module.exports = {authenticateJWT}