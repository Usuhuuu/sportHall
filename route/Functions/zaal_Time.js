const {ZaalSchema} = require('../model/dataModel')
const express = require('express');

const reserveTimeSlot = async (zaalId, startTime, endTime) => {
    await ZaalSchema.updateOne(
        { zaal_ID: zaalId, "timeSlots.startTime": startTime, "timeSlots.endTime": endTime },
        { $set: { "timeSlots.$.status": 'reserved' } }
    );
};



module.exports = {reserveTimeSlot}