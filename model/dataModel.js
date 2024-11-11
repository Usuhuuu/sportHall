const { google } = require('googleapis');
const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true   
    },
    phoneNumber: {
        type: String,   
        required: false
    },
    userType: {
        type: String,
        enum: ['admin', 'user', 'contractor'], 
        default: 'user',
    },
    // User subDocuments
    userNames: {
        firstName: {
            type: String,
            required: false
        },
        lastName: {
            type: String,
            required: false
        }
    },
    userPassword: {
        password: {
            type: String,
            required: false,
            minlength: 8
        },
        salt: {
            type: String,
            required: false
        }
    },
    userAgreeTerms: {
        agree_terms: {
            type: Boolean,
            required: true
        },
        agree_privacy: {
            type: Boolean,
            required: true
        }
    },
    third_party_user_ID:[{
        _id:false,
        provider:{
            type:String,
            required:false
        },
        provided_ID:{
            type:String,
            required:false
        }
    }]
}, {
    timestamps: true
});
const User = mongoose.model('User', userSchema);

// Transaction Success Schema
const transactionSchema  = new Schema({
    // _id bga 
    zaal_ID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "ZaalSchema"
    },
    user_ID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    day: {
        type: String, 
        required: true
    },
    start_time: {
        type: String, 
        required: true
    },
    end_time: {
        type: String,
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success','failed'],
        default: 'failed'
    },
    
}, {
    timestamps: true
});
const TransactionSchema = mongoose.model("Transactions", transactionSchema);

// Transaction Canceled Schema
const transCanceledSchema = new Schema({
    transaction_ID:{
        type: Schema.Types.ObjectId,
        required:true,
        ref:'Transactions'
    },
    refund_status:{
        type:String,
        enum:['success', 'pending','failed', "canceled"],
        default:'failed'
    },
    cancellationReason: {
        type: String,
    },
}, {
    timestamps: true
});
const Trans_Canceled = mongoose.model("Trans_Canceled", transCanceledSchema);

// Zaal Schema (Sport Hall)
const zaalSchema = new Schema({
    zaal_types: {
        type: String,
        required: true,
    },
    zaal_location: {
        type: String,
        required: true
    },
    zaal_owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    //sub Document for zaalnii medeelel zurag geh met
    // zaal_detail:{
    //     //google cloud deer hadgalah tolovlogoo bga
    //     imageURL:{
    //         type: String,
    //         require: false
    //     },
    // },
    base_time_slots:[{
        _id: false,
        start_time: {
            type: String,
        },
        end_time:{
            type: String,
        },
    }],
}, {
    timestamps: true
});
const ZaalSchema = mongoose.model("Zaal_info", zaalSchema);


// Chat Schema
const groupChatSchema = new Schema({
    members:[
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    ],
    transaction_ID:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"Transactions"
    },
    messages: [
        {
            senderId: {
                type: Schema.Types.ObjectId,
                required: true,
                ref: 'User'  
            },
            message: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});

const Group_Chat_Schema = mongoose.model("Group_Chat_Schema", groupChatSchema);

module.exports = { 
    User,
    TransactionSchema,
    Trans_Canceled,
    ZaalSchema,
    Group_Chat_Schema
};