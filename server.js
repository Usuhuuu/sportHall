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
const setupWebSocket = require('./route/Functions/chat.js')
const http = require('http');

//mongodb & redis Connections
connectDB();
    //middleWare 

//HSTS
app.use(helmet.hsts({
    maxAge:31536000,//seconds equals one year.
    includeSubDomains: true,
    preload:true //http gsen baihiig automataar https bolgon
}))
//

//CORS
const allowedOrigins = [
    "https://192.168.0.6:8081",
    "http://exp://192.168.0.6:8081",
    "exp://192.168.0.6:8081"
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));
app.use(express.json());
//

// noSQL injection prevent
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(mongoSanitize({
    replaceWith: '_',
    allowDots: false
}))
//

// Web Socket init
const server = http.createServer(app);
setupWebSocket(server);
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
const signup = require("./route/login&register/signup.js")
const login = require("./route/login&register/login.js")
const profile = require("./route/profile.js")
const chatRoute = require("./route/chatRoute.js")
const appLogin = require('./route/login&register/applogin.js')
const zaalorder = require('./route/zaal_order.js')

app.use(chatRoute)
app.use(signup)
app.use( profile)
app.use( login)
app.use(appLogin)
app.use(zaalorder)

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`server is running port ${PORT}`)
})