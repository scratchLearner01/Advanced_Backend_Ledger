import express from "express";
import accountMiddleware from "../middlewares/auth.middleware.js"
import accountController from "../controllers/account.controller.js";
// import cookieParser from "cookie-parser";

const router = express.Router();

router.post("/create",accountMiddleware.checkLogin,accountController.createAccount);
router.get("/balance",accountMiddleware.checkLogin,accountController.getBalance);
router.get("/",accountMiddleware.checkLogin,accountController.allAccounts);

export default router;