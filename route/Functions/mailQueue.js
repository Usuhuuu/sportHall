const { Worker, Queue } = require('bullmq');
const mailSender = require('./mail');
const redisClient = require('../../config/redisConnect');

(async () => {
    // Await the connected Redis client
    const client = await redisClient();

    // Extract connection details
    const redisConnection = {
        host: client.options.socket.host,
        port: client.options.socket.port,
        password: client.options.password
    };

    // Set up the email queue with the connection details
    const emailQueue = new Queue('emailQueue', { connection: redisConnection });

    // Create a worker to process jobs from the queue
    const worker = new Worker('emailQueue', async (job) => {
        const { fromMail, toMail, subject, text } = job.data;
        try {
            const result = await mailSender(fromMail, toMail, subject, text);
            console.log('Email sent successfully from queue:', result);
            return result;
        } catch (err) {
            console.error('Error sending email from queue:', err);
            throw err;
        }
    }, {
        connection: redisConnection
    });

    // Event listeners for job completion and failure
    worker.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed successfully`, result);
    });
    worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed`, err);
    });

    // Function to delete all jobs in the queue
    const deleteAllJobs = async () => {
        await emailQueue.obliterate({ force: true });
    };

    module.exports = { emailQueue, worker, deleteAllJobs };
})();