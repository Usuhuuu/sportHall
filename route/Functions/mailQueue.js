const {Worker,Queue} = require('bullmq')
const mailSender = require('./mail')
const redisClient = require('../../config/redisConnect')

const redisConnection = {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
};
// queue uusgej Workern ajilh ba email yvuulah hurdiig hurdasna
const emailQueue = new Queue('emailQueue', { connection: redisConnection });

const worker = new Worker('emailQueue', async job => {
    const { fromMail, toMail, subject, text } = job.data;
    try{
        const result = await mailSender(fromMail, toMail, subject, text)
        console.log('Email sent successfully from queue:', result);
        return result
    } catch(err){
        console.error('Error sending email from queue:', err);
        throw err;
    }
}, {
    connection: redisConnection
})
worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed successfully`, result);
});
worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed`, err);
});

const deletedJobIds =  async () => {
    // Delete Everythings
    await emailQueue.obliterate({ force: true });
}
module.exports = {emailQueue,worker,deletedJobIds}