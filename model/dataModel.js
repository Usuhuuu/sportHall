const { google } = require('googleapis');
const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
    unique_user_ID: {
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
        type: String,
        required: false,
        minlength: 8
    },
    userImage: {
        type: String,
        required: false
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
    third_party_user_ID: [{
        _id: false,
        provider: {
            type: String,
            required: false
        },
        provided_ID: {
            type: String,
            required: false
        }
    }],
    fav_hall_id: [{
        _id: false,
        user_fav_hall_ID: {
            type: Schema.Types.ObjectId,
            ref: 'Zaal_info'
        }
    }, { timestamps: true }],

}, {
    timestamps: true
});
const User = mongoose.model('User', userSchema);

const userFriendSchema = new Schema({
    user_ID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    friends: {
        type: [String],
        default: []
    },
    recieved_requests: [{
        _id: false,
        friend_requests_recieved_from: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    }, { timestamps: true }],

    send_requests: [{
        _id: false,
        friend_requests_sended_to: {
            type: String,
        }
    }, { timestamps: true }],
})

const User_Friend = mongoose.model('User_Friend', userFriendSchema);
// Transaction Success Schema
const transactionSchema = new Schema({
    // _id bga 
    zaal_ID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "ZaalSchema"
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
    num_players: {
        type: Number,
        required: true
    },
    current_player: {
        type: Number,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    paying_people: [{
        _id: false,
        paymentID: {
            type: Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false
        },
        amountPaid: {
            type: Number,
            required: false
        },
        payment_status: {
            type: String,
            enum: ["Pending", "Completed", "failed", "Expired"],
            default: "Pending"
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        refund_status: {
            type: String,
            enum: ["none", "requested", "completed"],
            default: "none"
        }
    }]

}, {
    timestamps: true
});
const TransactionSchema = mongoose.model("Transactions", transactionSchema);

// Transaction Canceled Schema
const transCanceledSchema = new Schema({
    transaction_ID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Transactions'
    },
    refund_status: {
        type: String,
        enum: ['success', 'pending', 'failed', "canceled"],
        default: 'failed'
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
    base_time_slots: [{
        _id: false,
        start_time: {
            type: String,
        },
        end_time: {
            type: String,
        },
    }],
    reviews: [{
        _id: false,
        user_ID: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        review_message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        rating: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
});
const ZaalSchema = mongoose.model("Zaal_info", zaalSchema);


// Chat Schema
const groupChatSchema = new Schema({
    members: [
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    ],
    transaction_ID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Transactions"
    },
    messages: [
        {
            _id: false,

            sender_unique_name: {
                type: String,
                required: true,
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


groupChatSchema.index({ "messages.timestamp": 1 });

const Group_Chat_Schema = mongoose.model("Group_Chat_Schema", groupChatSchema);

module.exports = {
    User,
    TransactionSchema,
    Trans_Canceled,
    ZaalSchema,
    Group_Chat_Schema,
    User_Friend
};