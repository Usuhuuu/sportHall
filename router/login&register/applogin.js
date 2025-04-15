const express = require('express')
const router = express.Router()
require('dotenv').config()
const { User } = require('../../model/dataModel');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { faker } = require('@faker-js/faker');
const { facebookUserLoginRouter, facebookUserSignupContinue } = require("./functions/facebook_login_methods")
const { googleLoginORsignup, googleSignupFinal } = require('./functions/google_login_method')

//status 200 for user exist 
//status 201 for user not exist and valid success
router.post("/auth/facebook", async (req, res) => {
    const { fbData: data } = req.body;
    try {
        const { accessToken: userAccessToken } = data;
        const { signUpTimer } = data;
        if (signUpTimer) {
            console.log("signup_continue")
            const signUpFinalResult = await facebookUserSignupContinue({ signUpTimer, data })

            if (signUpFinalResult.success) {
                return res.status(200).json({
                    success: signUpFinalResult.success,
                    accessToken: signUpFinalResult.accessToken,
                    refreshToken: signUpFinalResult.refreshToken,
                    message: signUpFinalResult.message,
                })
            }
        }
        if (!userAccessToken) {
            return res.status(400).json({ message: 'Invalid Facebook token' });
        }
        const userDataResponse = await facebookUserLoginRouter({ token: userAccessToken })

        if (userDataResponse.success && userDataResponse.existUser && (userDataResponse.data.accessToken && userDataResponse.data.refreshToken)) {
            console.log("existUser", userDataResponse.data)
            return res.status(200).json({
                success: true,
                accessToken: userDataResponse.data.accessToken,
                refreshToken: userDataResponse.data.refreshToken,
                message: userDataResponse.data.message
            })
        } else if (!userDataResponse.success && !userDataResponse.data) {
            return res.status(400).json({ message: "invalid token" })
        } else if (userDataResponse.data && userDataResponse.success && !userDataResponse.existUser) {
            const usersignupToken = jwt.sign({
                facebook_user_ID: userDataResponse.data.facebookID,
                verified: true,
            }, process.env.JWT_ACCESS_SECRET, {
                expiresIn: "10m"
            })
            return res.status(201).json({
                data: {
                    success: true,
                    firstName: userDataResponse.data.firstName,
                    lastName: userDataResponse.data.lastName,
                    email: userDataResponse.data.email,
                    id: userDataResponse.data.facebookID,
                    signUpTimer: usersignupToken,
                },
                success: true,
            })
        }
    } catch (err) {
        console.error("Facebook login error", err);
        res.status(500).json({ error: 'Facebook authentication failed' });
    }
});



router.post("/auth/google", async (req, res) => {
    const { accessToken: userAccessToken, fbData: data } = req.body;
    try {
        console.log("userAccessToken", req.body)
        if (data && data.signUpTimer) {
            console.log("signup_continue")
            const signUpFinalResult = await googleSignupFinal({ signUpTimer: data.signUpTimer, data })
            console.log("signUpFinalResult", signUpFinalResult)
            if (signUpFinalResult.success) {
                return res.status(200).json({
                    success: true,
                    accessToken: signUpFinalResult.data.accessToken,
                    refreshToken: signUpFinalResult.data.refreshToken,
                    message: signUpFinalResult.data.message


                })
            }
        }
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

        const userFind = await googleLoginORsignup({ googleID: googleId, userEmail: email })
        if (userFind.success && userFind.existUser && (userFind.data.accessToken && userFind.data.refreshToken)) {
            console.log("pisda1")
            return res.status(200).json({
                success: true,
                accessToken: userFind.data.accessToken,
                refreshToken: userFind.data.refreshToken,
                message: userFind.data.message

            })
        } else if (!userFind.success && !userFind.existUser && userFind.data.signUpTimer) {
            console.log("pisda2")

            return res.status(201).json({
                data: {
                    firstName: givenName,
                    lastName: familyName,
                    email: email,
                    googleID: googleId,
                    signUpTimer: userFind.data.signUpTimer
                },
                success: true,
                existUser: false,
            })
        }
    } catch (err) {
        console.error(err);
        const statusCode = err.response?.status || 500;
        res.status(statusCode).json({ error: 'Google authentication failed', details: err.message });
    }
});

module.exports = router 