const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateJWT = async (req, res, next) => {
    // Authorization Header check
    console.log("401 error check authorization")
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token missing', auth: false });  // Send response and return
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            // Return a single response on error
            return res.status(401).json({ message: "Invalid accessToken", auth: false });
        }
        if (!decoded || (!decoded.userID && !decoded.email)) {
            // Return if userID is missing in decoded token
            return res.status(400).json({ message: "User ID is missing in the token" });
        }
        // Save decoded user information in request for subsequent middleware
        req.user = decoded;

        // Continue to next middleware if everything is good
        next();
    });
};

module.exports = { authenticateJWT };