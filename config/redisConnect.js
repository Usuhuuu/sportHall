const redis = require('redis');

const redisClient = async () =>{
    try{
        const client = redis.createClient({url: process.env.REDIS_URL})
        await client.connect()
        console.log('Connected to Redis successfully');
        
        return client;
    }catch(err){
        console.log("redis Error",err)
    }
}


module.exports = redisClient