const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
    user_ID: {
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
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
        default: 'user',
    },
    // User subDocuments
    userNames: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        }
    },
    userPassword: {
        password: {
            type: String,
            required: true,
            minlength: 8
        },
        salt: {
            type: String,
            required: true
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
}, {
    timestamps: true
});
const User = mongoose.model('User', userSchema);

// Transaction Success Schema
const transactionSchema  = new Schema({
    transaction_ID: {
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
        unique: true,
    },
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
        type: Date, 
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
        enum: ['pending', 'success','failed', 'aborted'],
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
    zaal_ID: {
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
        required: true,
        unique: true
    },
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
    zaal_detail:{
        //google cloud deer hadgalah tolovlogoo bga
        imageURL:{
            type: String,
            require: true
        },
    },
    base_time_slots:[{
        start_time: {
            type: String,
            required: true,
        },
        end_time:{
            type: String,
            required: true,
        },
    }],
}, {
    timestamps: true
});
const ZaalSchema = mongoose.model("ZaalSchema", zaalSchema);


// Chat Schema
const groupChatSchema = new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
        required: true,
        unique: true
    },
    members:[
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    ],
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