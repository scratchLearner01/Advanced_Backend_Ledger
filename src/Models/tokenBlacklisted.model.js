import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "Token is required to blacklist" ],
        unique: [ true, "Token is already blacklisted" ]
    }
}, {
    timestamps: true
})

tokenBlacklistSchema.index({createdAt:1},{expireAfterSeconds: 24*60*60 });//1day

const tokenBlackListModel = mongoose.model('tokenBlackList',tokenBlacklistSchema);

export default tokenBlackListModel;