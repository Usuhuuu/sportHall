const mongoose = require('mongoose')
const {Schema, Types} = mongoose

const userSchema =  new Schema({
    userName_ID : {
        type: String,
        require: true,
        unique:true
    },
    email : {
        type:String,
        required: true,
    },
    phoneNumber:{
        type: Number,
        require: true
    },
    password: {
        type: String,
        require:true
    },
    userType:{
        type: String,
        enum: ['admin', 'user', 'contracter', 'guest'],
        require: true
    }
});
const User = mongoose.model('User', userSchema);

const userNames = new Schema({
    userName_ID:{
        type:Schema.Types.ObjectId,
        require:true,
        ref: "User"
    },
    firstName:{
        type:String,
        require:true,
    },
    lastName:{
        type:String,
        required: true,
    },
})
const UserNames = mongoose.model("User_Names", userNames)

const userAgreeSchema = new Schema({
    userName_ID:{
        type: Schema.Types.ObjectId,
        require: true,
        ref: "User"
    },
    agree_terms:{
        type: Boolean,
        require: true,
        null: false
    },
    agree_privacy:{
        type: Boolean,
        require: true,
        null: false
    }
})

const UserAgreements = mongoose.model("UserAgreeterms", userAgreeSchema)


module.exports = {User, UserAgreements, UserNames}