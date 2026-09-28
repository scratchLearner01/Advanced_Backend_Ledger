import mongoose from "mongoose";
import "dotenv/config"


async function connectDB(){
    try{
        await mongoose.connect(process.env.Mongo_KEY);
        console.log("Connected to DB");
    }catch(err){
        process.exit(1)
    }
        
}
export default connectDB;