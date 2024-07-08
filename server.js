const express = require('express')
require('dotenv').config();
const connectDB = require('./config/dbConnect.js')
const app = express()
const helmet = require('helmet');
const cors = require('cors')
connectDB();

//Router define
app.use(helmet.hsts({
    maxAge:31536000,
    includeSubDomains: true,
    preload:true
}))

const signup = require("./route/signup.js")
const login = require("./route/signup.js")
const profile = require("./route/profile.js")

app.use("/auth",signup,)
app.use("/auth", profile)
app.use("/auth", login)


//cors 
const corsOption = {
    credentials:true,
    //origin
}
app.use(cors(corsOption))


app.listen(process.env.PORT, () => {
    console.log(`server is running port ${process.env.PORT}`)
})