const express = require('express')
const router = express.Router();
const {sha3_256} = require('js-sha3')
const bcrypt = require('bcrypt');
const { User } = require('../model/dataModel');

router.post('./signup', async (req,res)=>{
    const {name, password, email,phoneNumber,agree_terms, agree_privacy, is_adult} =req.body
    try{
        const userFind = await User.findOne({email: email})
        if(userFind) {
            return res.status(401).json({message: "User Already Existing SDA"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash((password, salt))
        const newUser = new User({
            name: name,
            email: email,
            password :hashedPassword,
            phoneNumber: phoneNumber,
            agree_terms: true,
            agree_privacy: true,
            is_adult: true,
        })
        await newUser;
        res.status(201).json({ message: 'User created successfully!' });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})


module.exports = router;