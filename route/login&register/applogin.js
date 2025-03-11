const express = require('express')
const router = express.Router()
require('dotenv').config()
const axios = require('axios');
const { User } = require('../../model/dataModel');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { faker } = require('@faker-js/faker');


router.post("/auth/facebook", async (req, res) => {
    const { accessToken: userAccessToken } = req.body;
    try {
        const userDataResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: userAccessToken,
                fields: 'id,name,email'
            }
        });
        if (!userDataResponse.data || !userDataResponse.data.email) {
            return res.status(400).json({ message: 'Invalid Facebook token or no email provided' });
        }
        const user = userDataResponse.data;
        const [firstName, lastName = ''] = user.name.split(' ');
        const generateUsername = () => {
            // Generate a username with an adjective, a noun, and a random number
            const username = `${faker.word.adjective()}-${faker.word.noun()}-${faker.number.int({ min: 1000, max: 9999 })}`;
            return username;
        }
        const username = generateUsername();
        let findUser = await User.findOne({ email: user.email });
        if (!findUser) {
            try {
                findUser = await User.create({
                    email: user.email,
                    userNames: {
                        firstName,
                        lastName
                    },
                    unique_user_ID: username,
                    third_party_user_ID: [{
                        provider: "facebook",
                        provided_ID: user.id
                    }],
                    userAgreeTerms: {
                        agree_terms: true,
                        agree_privacy: true
                    }
                });
            } catch (err) {
                console.error("Facebook login: User creation failed", err);
                return res.status(500).json({ message: 'User creation failed' });
            }
        } else {
            try {
                await User.updateOne(
                    { email: user.email },
                    {
                        $addToSet: {
                            third_party_user_ID: {
                                provider: "facebook",
                                provided_ID: user.id
                            }
                        }
                    }
                );
            } catch (err) {
                console.error("Failed to update third_party_user_ID", err);
                return res.status(500).json({ message: 'User update failed' });
            }
        }
        const accessToken = jwt.sign({
            userID: findUser._id,
            unique_user_ID: findUser.unique_user_ID,
        }, process.env.JWT_ACCESS_SECRET, {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const refreshToken = jwt.sign({
            userID: findUser._id,
        }, process.env.JWT_REFRESH_SECRET, {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        });
        res.status(200).json({ auth: true, accessToken, refreshToken, message: "Successfully logged in with Facebook" });
    } catch (err) {
        console.error("Facebook authentication failed", err);
        res.status(500).json({ error: 'Facebook authentication failed' });
    }
});

router.post("/auth/google", async (req, res) => {
    const { accessToken: userAccessToken } = req.body;
    try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: userAccessToken });

        const peopleService = google.people({ version: 'v1', auth: oauth2Client });
        const userDataResponse = await peopleService.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses',
        });

        if (!userDataResponse.data || !userDataResponse.data.emailAddresses) {
            return res.status(400).json({ message: 'Invalid Google token' });
        }

        const user = userDataResponse.data;
        const email = user.emailAddresses[0]?.value;
        const givenName = user.names[0]?.givenName || '';
        const familyName = user.names[0]?.familyName || '';
        const googleId = user.resourceName.split('/')[1];


        const generateUsername = () => {
            // Generate a username with an adjective, a noun, and a random number
            const username = `${faker.word.adjective()}-${faker.word.noun()}-${faker.number.int({ min: 1000, max: 9999 })}`;
            return username;
        }
        const username = generateUsername();
        let findUser = await User.findOne({ email });

        if (!findUser) {
            try {
                findUser = await User.create({
                    email: email,
                    userNames: {
                        firstName: givenName,
                        lastName: familyName
                    },
                    unique_user_ID: username,
                    userAgreeTerms: {
                        agree_terms: true,
                        agree_privacy: true
                    },
                    third_party_user_ID: [{
                        provider: "google",
                        provided_ID: googleId
                    }]
                });
            } catch (err) {
                console.error("Google login: User creation failed", err);
                return res.status(500).json({ message: 'User creation failed' });
            }
        } else {
            try {
                await User.updateOne(
                    { email: email },
                    {
                        $addToSet: {
                            third_party_user_ID: {
                                provider: "google",
                                provided_ID: googleId
                            }
                        }
                    }
                );
            } catch (err) {
                console.error("Failed to update third_party_user_ID", err);
                return res.status(500).json({ message: 'User update failed' });
            }
        }
        const user_ID = findUser._id
        const accessTokens = jwt.sign({
            userID: user_ID,
            unique_user_ID: findUser.unique_user_ID
        }, process.env.JWT_ACCESS_SECRET, {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.JWT_EXPIRES_IN
        });
        console.log(accessTokens)

        const refreshToken = jwt.sign({
            userID: user_ID
        }, process.env.JWT_REFRESH_SECRET, {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        });

        res.status(200).json({
            auth: true,
            accessTokens,
            refreshToken,
            message: "Successfully logged in with Google"
        });
    } catch (err) {
        console.error(err);
        const statusCode = err.response?.status || 500;
        res.status(statusCode).json({ error: 'Google authentication failed', details: err.message });
    }
});

module.exports = router 