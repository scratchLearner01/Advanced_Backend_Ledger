import mongoose from "mongoose";
import bcrypt from "bcrypt"

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email can't be empty"],
        lowercase: true,
        unique: [true, "Email should be unique"],
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is mandatory field"],
        select: false,
        minlength: [6, "password must be  6 character or longer"]
    },
    username: {
        type: String,
        required: [true, "Username is mandatory field"]
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
    }
}, {
    timestamps: true
})


userSchema.pre("save",  async function(){

    if (!this.isModified("password"))
        return;
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
})


userSchema.methods.comparePassword = async function (password) {

    // console.log(password, this.password);

    return bcrypt.compare(password, this.password);

}

const userModel = mongoose.model("user",userSchema);

export default userModel;