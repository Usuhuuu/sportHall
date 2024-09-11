const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
    
    user_ID: {
        type: String,
        required: true,  
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true   
    },
    phoneNumber: {
        type: String,   
        required: true
    },
    userType: {
        type: String,
        enum: ['admin', 'user', 'contractor'], 
        required: true
    },
    // User AgreeTerms subDocument dotor hadgalna
    userAgreeTerms:{
        agree_terms: {
            type: Boolean,
            required: true
        },
        agree_privacy: {
            type: Boolean,
            required: true
        }
    }
},{
    timestamps: true,
});
const User = mongoose.model('User', userSchema);

// UserPassword Schema
const userPasswordSchema = new Schema({
    user_ID: {
        type: String,
        required: true,
        ref: "User",
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    salt: {
        type: String,
        required: true
    }
},{ 
 });
const UserPassword = mongoose.model('UserPassword', userPasswordSchema);

// UserNames Schema
const userNamesSchema = new Schema({
    user_ID: {
        type: String,
        required: true,
        ref: "User"
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    }
},{ 
 });
const UserNames = mongoose.model("UserNames", userNamesSchema);



module.exports = { User, UserNames, UserPassword };
