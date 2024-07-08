const express = require('express')
const router = express.Router();

router.post('./profile', async (req,res)=>{
    const {name, password, email} =req.body
    try{

    }
    catch(err){
        console.log(err)
    }
})

module.exports = router;