const express = require('express')
const router = express.Router();
const {User, UserAgreements} = require('../model/dataModel')
const {authenticateJWT} = require('./Functions/auth')

router.post('/profile', authenticateJWT, async (req,res)=>{
    const {userID, email}=req.body
    try{
        const userFind = await User.findOne({email, email}).exec()
        if(!userFind){
            return res.status(401).json({message: "User doesnt exist "});
        }
    }
    catch(err){
        console.log(err)
    }
})

module.exports = router;