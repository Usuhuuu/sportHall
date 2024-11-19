const redis = require('redis');
require('dotenv').config()

const redisClient = async () => {
    try {
        const client = redis.createClient({
            password:process.env.REDIS_PASSWORD,
            socket:{
                host: process.env.REDIS_URL,
                port: process.env.REDIS_PORT
            }
        });

        // this is how local redis connect start command: redis-server
        
        // const client = redis.createClient({
        //     socket:{
        //         host: "localhost",
        //         port: 6379
        //     }
        // });
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
