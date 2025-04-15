const jwt = require('jsonwebtoken');
require('dotenv').config();


const generateAccessToken = ({ userID, unique_user_ID, userType }) => {
    const accesstoken = jwt.sign({
        userID: userID,
        unique_user_ID: unique_user_ID,
        userType: userType
    }, process.env.JWT_ACCESS_SECRET, {
        algorithm: process.env.JWT_ALGORITHM,
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    return accesstoken;
}


const generateRefreshToken = ({ }) => {
    const refreshToken = jwt.sign({
        userID: userID,
    }, process.env.JWT_REFRESH_SECRET, {
        algorithm: process.env.JWT_ALGORITHM,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    })
    return refreshToken;
}

module.exports = { generateAccessToken, generateRefreshToken }