const express = require('express');
require('dotenv').config();
require('./router/Functions/sentry.js')//log tracing
const connectDB = require('./config/dbConnect.js');
const app = express();
const helmet = require('helmet'); //hsts
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize'); //noSQl injection
const rateLimit = require('express-rate-limit'); //limit rate
const setupWebSocket = require('./router/Functions/chat.js')
const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const { getSecret } = require('./config/azure.js')

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
    "127.0.0.1",
    "http://192.168.0.20:8081",
    "http://localhost:3000",
];

const corsOptions = {
    origin: (origin, callback) => {
        console.log("Request Origin: ", origin);  // Log the origin

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST"],
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

//Router define
const signup = require("./router/login&register/signup.js")
const login = require("./router/login&register/login.js")
const profile = require("./router/profile.js")
const chatRoute = require("./router/chatRoute.js")
const appLogin = require('./router/login&register/applogin.js')
const zaalorder = require('./router/zaal_order.js')
const friendRoute = require('./router/friendRoute.js')
const notification = require('./router/admin/notification.js')

app.use(chatRoute)
app.use(signup)
app.use(profile)
app.use(login)
app.use(appLogin)
app.use(zaalorder)
app.use(friendRoute)
app.use(notification)

// https init 
getSecret().then((pfx_cert) => {
    const httpsOptions = {
        pfx: pfx_cert,
        passphrase: process.env.PRIVATE_PASS,
    };
    //const httpsServer = https.createServer(httpsOptions, app);
    const httpServer = http.createServer(app);

    setupWebSocket(httpServer);

    const https_port = process.env.HTTPS_PORT || 443;
    httpServer.listen(https_port, () => {
        console.log(`HTTP running on https://localhost:${https_port}`);
    });
}).catch((err) => {
    console.error('Error fetching certificate:', err);
});
