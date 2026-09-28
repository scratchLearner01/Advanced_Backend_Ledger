import mongoose from "mongoose";

const accountSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message:"Status can either be ACTIVE FROZEN OR CLOSED"
        },
        default:"ACTIVE"
    },
    currency:{
        type:String,
        required:true,
        default:"INR"
    }
},{
    timestamps:true
})

accountSchema.index({user:1 , status:1});

const accountModel = mongoose.model("account",accountSchema);


export default accountModel;