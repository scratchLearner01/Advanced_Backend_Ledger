import jwt from "jsonwebtoken"
import "dotenv/config"
import userModel from "../Models/user.model.js";
import tokenBlackListModel from "../Models/tokenBlacklisted.model.js";

async function checkLogin(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]


    if (!token) return res.status(400).json("Register / Login first to create an account.");
    const isBlacklisted = await tokenBlackListModel.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(400).json("Register / Login first to create an account.")
    }

}
async function authSystemUserMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY)
        console.log(decoded);

        const user = await userModel.findById(decoded.userid).select("+systemUser")
        console.log(user);

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user

        return next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
            errorMessage: err.message
        })
    }

}


export default { checkLogin, authSystemUserMiddleware };