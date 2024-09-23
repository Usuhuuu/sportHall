const mongoose = require('mongoose');
const connectionString = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.abf8jmt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const connectDB = async () => {
    try{
        await mongoose.connect(connectionString, {
            authSource: 'admin', 
            //useUnifiedTopology: true,
            //useNewUrlParser: true
        })
        console.log("successfully connected DB")
    }catch(err){
        console.log(err)
    }
}
module.exports = connectDB