const express = require('express');
require('dotenv').config();
require('./route/Functions/sentry.js')//log tracing
const connectDB = require('./config/dbConnect.js');
const app = express();
const helmet = require('helmet'); //hsts
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize'); //noSQl injection
const redisClient = require('./config/redisConnect.js'); //verification code storage 
const rateLimit = require('express-rate-limit'); //limit rate
const setupWebSocket = require('./route/Functions/chat.js')
const https = require('node:https');
const fs = require('node:fs');
const crypto = require('crypto');

//mongodb & redis Connections
connectDB();
//middleWare 

app.set('trust proxy', 1);
//HSTS secure 
app.use(helmet.hsts({
    maxAge: 31536000,//seconds equals one year.
    includeSubDomains: true,
    preload: true //http gsen baihiig automataar https bolgon
}))

//CORS
const allowedOrigins = [
    "http://localhost:8081",
    "https://localhost:8081",
    "exp://192.168.0.20:8081",
    "exp://192.168.0.20:8081",
    "118.176.174.110",
    "127.0.0.1"
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));
app.use(express.json());

// noSQL injection prevent
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(mongoSanitize({
    replaceWith: '_',
    allowDots: false
}))

// rate Limiter
let requestCounts = {}
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        res.status(429).send('Too many requests, please try again later.');
    }
})
app.use(limiter)


app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress; // Get IP
    const endpoint = req.originalUrl; // Requested endpoint
    const method = req.method; // HTTP method

    const key = `${ip}-${endpoint}`;

    requestCounts[key] = (requestCounts[key] || 0) + 1; // Track count

    console.log(
        `IP ${ip} has made ${requestCounts[key]} requests to [${method}] ${endpoint}`
    );

    next();
});



//

//Router define
const signup = require("./route/login&register/signup.js")
const login = require("./route/login&register/login.js")
const profile = require("./route/profile.js")
const chatRoute = require("./route/chatRoute.js")
const appLogin = require('./route/login&register/applogin.js')
const zaalorder = require('./route/zaal_order.js')
const friendRoute = require('./route/friendRoute.js')
const notification = require('./route/admin/notification.js')

app.use(chatRoute)
app.use(signup)
app.use(profile)
app.use(login)
app.use(appLogin)
app.use(zaalorder)
app.use(friendRoute)
app.use(notification)


// https init 
const decryptedKey = crypto.createPrivateKey({
    key: fs.readFileSync(`${process.env.PRIVATE_KEY}`, 'utf8'),
    passphrase: process.env.PRIVATE_PASS
}).export({
    type: 'pkcs8',
    format: 'pem'
})

const httpsOptions = {
    key: decryptedKey,
    cert: fs.readFileSync(`${process.env.CERTIFICATE_PATH}`, 'utf8'),
    ca: fs.readFileSync(`${process.env.CA_CERTIFICATE_PATH}`, 'utf8')
};
const httpsServer = https.createServer(httpsOptions, app)

setupWebSocket(httpsServer)

const https_port = process.env.HTTPS_PORT || 443

app.listen(https_port, () => {
    console.log(`https running on https://localhost:${https_port}`)
})
