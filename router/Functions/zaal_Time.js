const { ZaalSchema } = require('../../model/dataModel')

const reserveTimeSlot = async (zaalId, startTime, endTime) => {
    await ZaalSchema.updateOne(
        { zaal_ID: zaalId, "timeSlots.startTime": startTime, "timeSlots.endTime": endTime },
        { $set: { "timeSlots.$.status": 'reserved' } }
    );
};



module.exports = { reserveTimeSlot }