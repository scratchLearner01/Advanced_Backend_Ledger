import express from "express"
import authRouter from "./Routes/auth.routes.js"
import cookieParser from "cookie-parser";
import accountRouter from "./Routes/account.routes.js"
import trasactionRouter from "./Routes/transaction.routes.js"
import transactionController from "./controllers/transaction.controller.js";

const app = express();


app.use(express.json());
app.use(cookieParser());

app.use("/api/auth/",authRouter);
app.use("/api/account/",accountRouter);
app.use("/api/transaction/",trasactionRouter);

export default app;