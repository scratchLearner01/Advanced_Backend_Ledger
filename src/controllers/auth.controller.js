import userModel from "../Models/user.model.js";
import jwt from "jsonwebtoken"
import "dotenv/config"
import mailService from "../services/mail.service.js";
import tokenBlackListModel from "../Models/tokenBlacklisted.model.js";

async function userRegister(req, res) {

    try {
        const { username, email, password } = req.body;
        const user = await userModel.create({ email, username, password });
        const token = jwt.sign({ userid: user._id }, process.env.JWT_KEY, { expiresIn: "1d" });
        res.cookie("token", token);
        user.password = undefined;

        await mailService.sendWelcomeEmail(user.email, user.username, "Registered Successfully", `welcome, 
            ThankYou ${user.username} for choosing our platform`);

        res.status(201).json({

            success: true,
            message: "Congo !! User registered successfully!!",
            data: {
                user
            }
        })



    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}


async function userLogin(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");
    if (!user)
        return res.status(401).json({ message: "Please enter a valid email" });

    if (!(await user.comparePassword(password)))
        return res.status(401).json({ message: "incorrect Password" });

    const token = jwt.sign({ userid: user._id }, process.env.JWT_KEY, { expiresIn: "1d" });
    res.cookie("token", token);
    res.status(200).json({ message: "Loggged in successfully" })

    await mailService.sendWelcomeEmail(user.email, user.username, "Logged in successfully", `Welcome,
        If it's not you then quickly report it to bank`);

}

async function userLogout(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
        if (!token)
            return res.status(400).json({ Message: "Login/Register first to Logout" });


        const decoded = await jwt.verify(token, process.env.JWT_KEY);
        tokenBlackListModel.create({
            token
        })
        res.clearCookie("token");
        res.status(200).json({ message: "Logged Out Successfully" });

        await mailService.sendWelcomeEmail(user.email, user.username, "Logged Out successfully", `If it's not you then quickly report it to bank`);
    } catch (err) {
        return res.status(400).json({ errorMessage: err.message });
    }
}

export default { userRegister, userLogin, userLogout };