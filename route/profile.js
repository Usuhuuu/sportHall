const express = require('express')
const router = express.Router();
const {User, UserAgreements} = require('../model/dataModel')

router.post('/profile', async (req,res)=>{
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