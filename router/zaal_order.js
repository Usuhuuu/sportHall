const express = require('express');
const router = express.Router();
const reserveTimeSlot = require('./Functions/zaal_Time')
const { authenticateJWT } = require('./Functions/auth')
const { emailQueue } = require('./Functions/mailQueue')
const { ZaalSchema, TransactionSchema, Trans_Canceled, User, Group_Chat_Schema } = require('../model/dataModel')

router.post('/reserve', authenticateJWT, async (req, res) => {
    const SOFT_RESERVATION_TIMEOUT = 10 * 60 * 1000;
    const { zaalId, date, startTime, endTime, num_players, current_player, total_amount } = req.body;
    try {
        const decodedUserID = req.user.userID
        const zaal = await ZaalSchema.findOne({ _id: zaalId })
        if (zaal) {
            // time slotiig odor tsagaarn shalgaad herev success bol 400 ogno
            const isReserved = await TransactionSchema.findOne({
                zaal_ID: zaalId,
                day: date,
                start_time: startTime,
                end_time: endTime,
                "paying_people.payment_status": { $in: ['Completed', 'Pending'] }
            })
            if (isReserved) {
                if (isReserved.paying_people.payment_status == 'Completed') {
                    return res.status(400).json({
                        available: false,
                        message: 'Time slot is already reserved.',
                    });
                } else if (isReserved.paying_people.payment_status == "Pending") {
                    return res.status(200).json({
                        available: true,
                        message: 'Time slot is available to join.',
                    });
                }
            }
            //payment heseg orood success hivel update hiin
            const payment = true
            // {
            //     amount: amountPaid,
            //     userId: user_ID,
            //     callbackUrl: `${process.env.BASE_URL}/api/payment/callback`,
            // }
            let amountPaid = 1000

            if (payment) {
                try {
                    const reserving = await TransactionSchema.create(
                        {
                            zaal_ID: zaalId,
                            day: date,
                            start_time: startTime,
                            end_time: endTime,
                            num_players: num_players,
                            current_player: current_player,
                            total_amount: total_amount,
                            paying_people: [
                                {
                                    user_ID: decodedUserID,
                                    amountPaid: amountPaid || "10000",
                                    num_players,
                                    payment_status: "Pending",
                                }
                            ]

                        },
                    )
                    if (reserving) {
                        try {
                            const newGroup = await Group_Chat_Schema.create({
                                members: [decodedUserID],
                                messages: [],
                                transaction_ID: reserving._id
                            })
                            const groupID = newGroup.groupId
                            const user = User.findById(decodedUserID)
                            await emailQueue.add('reservationEmail', {
                                fromMail: process.env.GMAIL_USER,
                                toMail: user.email,
                                subject: "Successfully Reserved",
                                text: `${date, 'T' + startTime, " ", endTime}`
                            })
                            return res.status(200).send('Successfully Reserved Sda')
                        } catch (err) {
                            console.log('create groupchat and send email')
                        }
                    }
                } catch (err) {
                    res.status(500).send("failed to reserve")
                }

            } else {
                return res.status(400).send('Failed to pay');
            }
            res.status(200).send({ message: `Successfully reserved on ${date, 'T' + startTime, " ", endTime}`, available: true })
        } else {
            console.log(zaal)
        }

    } catch (err) {
        console.log(err)
        return res.status(500).send("error on reserve", err)
    }

})

router.post('/auth/cancelreserve', authenticateJWT, async (req, res) => {
    const { transaction_ID, reason } = req.body
    try {
        const trans_Update = await TransactionSchema.findOneAndUpdate(
            { _id: transaction_ID, paymentStatus: "aborted" },
            { $set: { paymentStatus: "failed" } },
            { new: true }
        )
        trans_Update ? await Trans_Canceled.create({ transaction_ID: transaction_ID, refund_status: "pending", cancellationReason: reason }) && res.status(200).json({ message: "Transaction successfully canceled.", transaction_status: 'Canceled' })
            : res.status(400).json({ message: "Transaction does not exist or is not successful." });

        await emailQueue.add('cancellationEmail', {
            fromMail: process.env.GMAIL_USER,
            toMail: trans_Update.user_ID.email,
            subject: "Reservation Canceled",
            text: `Your reservation on ${trans_Update.day} has been canceled.`
        });
        return res.status(200).send("Transaction successfully canceled.");
    } catch (err) {
        console.error(err);
        return res.status(500).send('error transaction cancel');
    }
})
router.post('/auth/zaalburtgel', authenticateJWT, async (req, res) => {
    const { zaal_location, zaal_type, baseTimeSlots } = req.body
    try {
        const decodedUserID = req.user.userID
        console.log(decodedUserID)
        const userFind = await User.findOne({ _id: decodedUserID, userType: "contractor" })
        if (!userFind) return res.status(400).send("User Doesnt exist")
        try {
            const zaalShaasn = await ZaalSchema.create({
                zaal_types: zaal_type,
                zaal_location: zaal_location,
                zaal_owner: userFind._id,
                base_time_slots: baseTimeSlots
            })
            if (zaalShaasn) {
                console.log(zaalShaasn)
                res.status(200).json({ message: "zaal burtguulse " })
            }
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: "error on zaal burtgel" })
        }
    } catch (err) {
        res.status(500).send('Server Error')
        console.log(err)
    }
})

//ProUser tsagaa ehlej oruulj ogno 
router.post('/auth/basetimeslots', authenticateJWT, async (req, res) => {
    const { baseTimeSlots, zaalId, } = req.body;
    try {
        // ene decodedUserID n auth file aas decoted userID awj bn 
        const decodedUserID = req.user.userID
        const result = await ZaalSchema.updateOne(
            { zaal_ID: zaalId, zaal_owner: decodedUserID },
            { $set: { base_time_slots: baseTimeSlots } }
        )
        console.log(result)
        if (result.modifiedCount > 0) {
            return res.status(200).send('Time slots added successfully.');
        } else {
            return res.status(404).send('Zaal not found or you are not authorized to modify it.');
        }
    } catch (err) {
        console.log(err)
    }

})

// const baseTimeSlots = [
//     { start_time: "10:00", end_time: "12:00" },
//     { start_time: "12:00", end_time: "14:00" },
//     { start_time: "14:00", end_time: "16:00" },
// ];


router.get('/timeslotscheck', async (req, res) => {
    const { zaalniID, odor } = req.query;
    try {
        const available = await TransactionSchema.find({
            zaal_ID: zaalniID,
            day: odor,
            paying_people: {
                $elemMatch: { payment_status: { $in: ['Completed', 'Pending'] } }
            }
        })
        //console.log(JSON.stringify(available, null, 2))
        if (available.length > 0) {

            const orderedTime = available.map(result => {
                return {
                    time: `${result.start_time}~${result.end_time}`,
                    total_member: result.num_players,
                    current_player: result.current_player,
                    status: result.paying_people.map(payment => payment.payment_status),

                };
            });
            console.log(orderedTime)
            if (orderedTime) {
                return res.json({
                    available: false,
                    message: `date: ${odor} times are checked and need members`,
                    not_possible_time: { orderedTime }
                });
            }
        } else {
            // No transactions found, meaning the time slots are available
            res.json({
                message: "All available",
                available: true,
                not_possible_time: ""
            });
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/auth/zaal_review_update', authenticateJWT, async (req, res) => {
    const { message, zaal_ID, rating } = req.body
    console.log(message, zaal_ID, rating)
    try {
        const decodedUserID = req.user.userID
        if (!decodedUserID) res.json({ message: "User not founded", auth: false })
        const zaal_review = await ZaalSchema.findOneAndUpdate({ _id: zaal_ID }, {
            $push: {
                reviews: {
                    user_ID: decodedUserID,
                    review_message: message,
                    rating: rating
                }
            }
        })
        console.log(zaal_review)
        if (zaal_review) {
            res.status(200).json({ message: "review added" })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post("/auth/favorite_halls", authenticateJWT, async (req, res) => {
    const { zaal_ID } = req.body
    try {
        const decodedUserID = req.user.userID
        const findUser = await User.findOneAndUpdate({ _id: decodedUserID }, {
            $push: {
                fav_hall_id: zaal_ID
            }
        })
        if (!zaal_ID) {
            res.status(400).json({ message: "User not founded", success: false })
        }

        res.status(200).json({ message: "Hall added to favorite", success: true })

    } catch (err) {
        console.log(err)
    }
})
router.post("/test/mailsend", async (req, res) => {
    const { fromMail, toMail, mail_subject, mail, text } = req.body
    try {
        const result = await emailQueue.add("testEmail", {

        })
    } catch (err) {
        console.log(err)
    }
})









module.exports = router;