const express = require('express');
require('dotenv').config();
const connectDB = require('./config/dbConnect.js');
const app = express();
const helmet = require('helmet'); //hsts
const cors = require('cors'); 
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize'); //noSQl injection
const redisClient = require('./config/redisConnect.js'); //verification code storage 
const rateLimit = require('express-rate-limit'); //limit rate

//mongodb & redis Connections
connectDB();
redisClient()

//middleWare 
app.use(helmet.hsts({
    maxAge:31536000,//seconds equals one year.
    includeSubDomains: true,
    preload:true //http gsen baihiig automataar https bolgon
}))
const allowedOrigins = ["https://192.168.0.6:8081", 'http://exp://192.168.0.6:8081', 'exp://192.168.0.6:8081'];
const corsOption = {
    origin: (origin, callback) => !origin || allowedOrigins.indexOf(origin) !== -1 ? callback(null, true) : callback(new Error("Not allowed by CORS")),
    credentials:true,
}
app.use(cors(corsOption));
app.use(express.json())

const setCorsHeader =(req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}
app.use(setCorsHeader);

// noSQL injection prevent
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(mongoSanitize({
    replaceWith: '_',
    allowDots: false
}))
//

// rate Limiter
const limiter = rateLimit({
    windowMs: 15*60*1000,
    max:100,
    message: 'Too many requests from this IP, please try again later'
})

app.use(limiter);
//


//Router define
const signup = require("./route/signup.js")
const login = require("./route/login.js")
const profile = require("./route/profile.js")

app.use("/auth",signup,)
app.use("/auth", profile)
app.use("/auth", login)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`server is running port ${PORT}`)
})