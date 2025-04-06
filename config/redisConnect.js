const Redis = require('ioredis');
require('dotenv').config()

const redisOption = {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    //tls: process.env.REDIS_TLS === 'true' ? {} : false
}
const redisClient = new Redis(redisOption);
// this is how local redis connect start command: redis-server

// const client = redis.createClient({
//     socket:{
//         host: "localhost",
//         port: 6379
//     }
// });
redisClient.on('connect', () => {
    console.log('Redis client connected');
});
redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});



module.exports = redisClient;
