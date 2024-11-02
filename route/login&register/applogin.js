const express = require('express')
const router = express.Router()
require('dotenv').config()
const axios = require('axios');
const { User } = require('../../model/dataModel');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

router.post("/auth/facebook",async (req,res)=> {
    const { accessToken:userAccessToken } = req.body;
    try{
        const userDataResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
              access_token: userAccessToken,
              fields: 'id,name,email'
            }
        });
        console.log(userDataResponse.data)
        if(!userDataResponse && userDataResponse.data.email ) 
            return res.status(400).json({ message: 'Invalid Facebook token' });
        const user= userDataResponse.data;
        const findUser = User.findOne(user.email)
        if(!findUser) {
            try{
                const userCreate = new User({
                    email: fbUserData.email,
                    name: fbUserData.name,
                    facebookID: fbUserData.id, 
                    userPassword: null 
                })
                await userCreate.save();
            }catch(err){
                console.log("Facebook login DIdnt saved on database")
            }
        }
        const accessToken = jwt.sign({
            userID: user.id,
            email: findUser.email
        },process.env.JWT_ACCESS_SECRET,{
            algorithm: 'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN
        })
        const refreshToken = jwt.sign({
            userID: findUser._id,
        },process.env.JWT_REFRESH_SECRET,{
            algorithm: 'HS256',
            expiresIn: '30d'
        })
        
        res.status(200).json({ auth: true, accessToken, refreshToken, message:"successfully logined with facebook"})
    }catch(err){
        console.log(err)
        res.status(err.status).json({ error: 'Facebook authentication failed' });
    }
})


router.post("/auth/google",async (req,res)=> {
    const { accessToken: userAccessToken } = req.body;
    try{
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: userAccessToken });
        const peopleService = google.people({ version: 'v1', auth: oauth2Client });
        const userDataResponse = await peopleService.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses',
        });
        if(userDataResponse.code == 403 || userDataResponse.status == "PERMISSION_DENIED" ){
            console.log("sda on google")
        }
        if(!userDataResponse.data || !userDataResponse.data.emailAddresses ) return res.status(400).json({ message: 'Invalid Facebook token' });
        const user = userDataResponse.data;
        const email = user.emailAddresses[0]?.value
        const givenName = user.names[0]?.givenName
        const familyName = user.names[0]?.familyName
        const googleId = user.resourceName.split('/')[1]
        console.log(googleId)
        const findUser = User.findOne(user.email)
        if(!findUser) {
            try{
                const userCreate = new User({
                    email: email,
                    userNames:{
                        firstName:givenName,
                        lastName: familyName
                    },
                    googleId: googleId, 
                    userPassword: null 
                })
                await userCreate.save();
            }catch(err){
                console.log("Facebook login DIdnt saved on database")
            }
        }
        const accessTokens = jwt.sign({
            userID: user.id,
            email: email
        },process.env.JWT_ACCESS_SECRET,{
            algorithm: 'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN
        })
        const refreshToken = jwt.sign({
            email: email,
        },process.env.JWT_REFRESH_SECRET,{
            algorithm: 'HS256',
            expiresIn: '30d'
        })
        res.status(200).json({ auth: true, accessTokens, refreshToken, message:"successfully logined with facebook"})
    }catch(err){
        console.log(err)
        const statusCode = err.response?.status || 500;
        res.status(statusCode).json({ error: 'Google authentication failed', details: err.message });
    }
})


module.exports = router 