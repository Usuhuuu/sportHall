const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const {User} = require('../model/dataModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config();

router.post('./login', async (req,res)=>{
    const {name, password, email} =req.body
    try{
        const userFind = await User.findOne({email: email})
        if(!userFind) {
            return res.status(401).json({message: "User Alrady Existing SDA"});
        }
        const isPasswordValid = await bcrypt.compare(password, userFind.hashedPassword)
        if(isPasswordValid){
            const accessToken = jwt.sign(
            {
                userID:User.userID,
                email: User.email,
                
            },process.env.JWT_ACCESS_SECRET,
            {
                algorithm: 'HS256', expiresIN: '1h',
            })
            const refreshToken = jwt.sign(
            {
                userID: User.userID,
            },process.env.JWT_REFRESH_SECRET,
            {
                algorithm: 'HS256', expiresIn: '1h',
            }
            )
            res.status(200).json({auth:true, accessToken, refreshToken})
        }else{
            return res.status(500).json({ auth: false, message: 'Wrong email or password' });
        }
    }
    catch(err){
        console.log(err)
    }
})
router.post("/refresh", (req, res) => {
    const refreshToken = req.headers["refresh"];
    if (refreshToken == null) return res.sendStatus(401);
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = jwt.sign({ userID: user.userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1h",
      });
      res.status(200).json({accessToken})
    });
});

module.exports = router;