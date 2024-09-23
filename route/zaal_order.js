const express = require('express');
const {ZaalSchema, TransactionSchema,Trans_Canceled, User} = require('../model/dataModel')
const router = express.Router()
const reserveTimeSlot = require('./Functions/zaal_Time')
const {authenticateJW} = require('./Functions/auth')
const {emailQueue} = require('./Functions/mailQueue')


router.post('/reserve', async (res,req)=> {
    const SOFT_RESERVATION_TIMEOUT = 10 * 60 * 1000;
    const { zaalId, date, startTime, endTime,user_ID } = req.body;
    try{
        const zaal = await ZaalSchema.findOne({zaal_ID: zaalId})
        if(zaal){
            // time slotiig odor tsagaarn shalgaad herev success bol 400 ogno
            const isReserved = TransactionSchema.findOne({
                zaal_ID: zaalId,
                day: date,
                start_time:startTime,
                end_time: endTime,
                paymentStatus: 'success'
            })
            if(isReserved) return res.status(400).send('Time slot is already reserved.', {available: false});
            //payment heseg orood success hivel update hiin
            const payment = true // if payment successfully occured it will true
            if(payment){
                try{
                    const reserving = await TransactionSchema.create(
                        {
                            zaal_ID: zaalId,
                            user_ID: user_ID,
                            day_Time: dayTime,
                            amountPaid: amountPaid,
                            paymentStatus: 'success'
                        },
                    ) 
                    if(reserving){
                        await emailQueue.add('reservationEmail', {
                            fromMail: process.env.GMAIL_USER,
                            toMail: email,
                            subject: "Successfully Reserved",
                            text: `${date,'T'+ startTime," ",endTime}`
                        })
                    }
                    return res.status(200).send('Successfully Reserved Sda')
                    
                } catch(err){
                    console.log(err)
                    res.status(500).send("failed to reserve")
                }
            } else return res.status(400).send('Failed to pay');
            res.status(200).send({message: `Successfully reserved on ${date,'T'+ startTime," ",endTime}`, available: false})
        }
    }catch(err){
        return res.status(500).send("error on reserve", err)
    }
    
})

router.post('/cancelreserve', authenticateJW, async (res,req)=> {
    const {transaction_ID,reason} = req.body
    try{
        const trans_Update = await TransactionSchema.findOneAndUpdate(
            {transaction_ID: transaction_ID, paymentStatus: "success"},
            {$set: {paymentStatus: "canceled"}},
            { new: true }  // Ensure the updated document is returned
        )
        trans_Update ? 
            await Trans_Canceled.create({ transaction_ID: transaction_ID, cancellationReason: reason }) && res.status(200).send("Transaction successfully canceled.") 
            : res.status(400).send("Transaction does not exist or is not successful.");

        await Trans_Canceled.create({
            transaction_ID: transaction_ID,
            cancellationReason: reason
        })
        await emailQueue.add('cancellationEmail', {
            fromMail: process.env.GMAIL_USER,
            toMail: trans_Update.user_ID.email, 
            subject: "Reservation Canceled",
            text: `Your reservation on ${trans_Update.day} has been canceled.`
        });
        return res.status(200).send("Transaction successfully canceled.");
    }catch(err){
        console.error(err);
        return res.status(500).send('error transaction cancel');
    }
})

router.post('/zaalburtgel',authenticateJW, async (req,res)=> {
    const {user_ID,zaal_location} =req.body
    try{
        const userFind =await User.findOne({user_ID: user_ID,userType: "contractor"})
        if(!userFind) return res.status(400).send("User Doesnt exist")
    
        await ZaalSchema.create({
            zaal_type:"",
            zaal_location: zaal_location,
            zaal_owner: user_ID,
            zaal_detail:{
                imageURL:zaalId // zuragni url oruuldag bolgon 
            }
        })
    }catch(err){
        res.status(200).send('Server Error')
        console.log(err)
    }
    
    
})





//ProUser tsagaa ehlej oruulj ogno 
router.post('/basetimeslots',authenticateJW, async (req,res)=> {
    const {baseTimeSlots,zaalId } = req.body;
    await ZaalSchema.updateOne(
        {zaal_ID: zaalId, zaal_owner: req.user.id},
        { $set: { baseTimeSlots: baseTimeSlots } }
    )
    if (result.nModified > 0) {
        return res.status(200).send('Time slots added successfully.');
    } else {
        return res.status(404).send('Zaal not found or you are not authorized to modify it.');
    }
})
// const baseTimeSlots = [
//     { start_time: "10:00", end_time: "12:00" },
//     { start_time: "12:00", end_time: "14:00" },
//     { start_time: "14:00", end_time: "16:00" },
// ];

