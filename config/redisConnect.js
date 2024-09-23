const redis = require('redis');

const redisClient = async () => {
    try {
        const client = redis.createClient({
            url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}`,
            password: process.env.REDIS_PASSWORD
        });
        client.on('error', (err) => {
            console.error('Redis error:', err);
        });
        await client.connect();
        console.log('Connected to Redis successfully');
        return client;
    } catch (err) {
        console.error('Redis connection error:', err);
        throw err;
    }
};

module.exports = redisClient;
