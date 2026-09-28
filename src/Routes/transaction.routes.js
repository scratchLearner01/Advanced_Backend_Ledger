import express from "express"
import transactionController from "../controllers/transaction.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/",authMiddleware.checkLogin,transactionController.transactionHandler);


router.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFund);




export default router;