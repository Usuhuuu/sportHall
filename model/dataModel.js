const mongoose = require('mongoose')
const {Schema, Types} = mongoose
const userSchema =  new Schema({
    userID : {
        type: String,
        require: true,
        unique:true
    },
    email : {
        type:String,
        required: true,
    },
    password: {
        type: String,
        require:true
    }
});


const User = mongoose.model('User', userSchema);
module.exports = {User}