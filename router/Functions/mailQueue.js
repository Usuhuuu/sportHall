const { Worker, Queue } = require('bullmq');
const mailSender = require('./mail');
const redisClient = require('../../config/redisConnect');
require('dotenv').config();

// Create Redis connection options for BullMQ
const redisConnection = {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
};

// Initialize the BullMQ queue
const emailQueue = new Queue('emailQueue', { connection: redisClient });

// Create a worker to process jobs from the queue
const worker = new Worker(
    'emailQueue',
    async (job) => {
        const { fromMail, toMail, subject, text } = job.data;
        try {
            const result = await mailSender(fromMail, toMail, subject, text);
            console.log('📧 Email sent successfully from queue:', result);
            return result;
        } catch (err) {
            console.error('Error sending email from queue:', err);
            throw err;
        }
    },
    {
        connection: redisConnection,
    }
);

// Event listeners for job completion and failure
worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully`, result);
});
worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed`, err);
});

// Function to delete all jobs in the queue
const deleteAllJobs = async () => {
    await emailQueue.obliterate({ force: true });
};

// Export modules
module.exports = { emailQueue, worker, deleteAllJobs };