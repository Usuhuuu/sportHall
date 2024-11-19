const express = require('express')
const router = express.Router();
const {User} = require('../model/dataModel')
const {authenticateJWT} = require('./Functions/auth')

router.get('/auth/profile', authenticateJWT, async (req,res)=>{
    try{
        const userFind = await User.findOne({_id: req.user.userID})
        if(!userFind){
            return res.status(401).json({message: "User doesnt exist "});
        } 
        const formData =JSON.stringify({
            email: userFind.email,
            phoneNumber:userFind.phoneNumber,
            userNames:{
                firstName: userFind.firstName,
                lastName: userFind.lastName
            },
        })
        res.json({formData, auth:true})
    }
    catch(err){
        console.log(err)
    }
})

module.exports = router;