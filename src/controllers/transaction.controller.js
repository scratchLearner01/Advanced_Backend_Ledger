import transactionModel from "../Models/transaction.model.js";
import accountModel from "../Models/account.model.js";
import ledgerModel from "../Models/ledger.model.js";
import userModel from "../Models/user.model.js";
import mongoose from "mongoose";

async function transactionHandler(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
    if (!toAccount || !idempotencyKey || amount < 0)
        return res.status(404).json({ message: "toAccount, amount and idempotencyKey are required" });

    const toUserAccount = await accountModel.findOne({ _id: toAccount });

    const fromUserAccount = await accountModel.findOne({ _id: fromAccount });

    if (!fromUserAccount || !toUserAccount)
        return res.status(400).json({ Message: "Invalid account/accounts" });
    if (fromUserAccount.user != req.user.userid)
        return res.status(400).json({ message: "Account doesnot belongs to you" });
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

        }

        if (isTransactionAlreadyExists.status === "PENDING") {

            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    const fromLedger = await ledgerModel.find({ account: fromUserAccount._id });
    let debit = 0, credit = 0;
    for (const tran of fromLedger) {
        if (tran.type == "CREDIT")
            credit += tran.amount;
        else
            debit += tran.amount;
    }
    const finalAmount = credit - debit;

    if (finalAmount < amount)
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${finalAmount}. Requested amount is ${amount}`
        })

    let transaction;
    try {
        transaction = await transactionModel.create({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey
        });
    } catch (err) {
        if (err.code === 11000) {
            const existing = await transactionModel.findOne({ idempotencyKey });

            return res.status(200).json({
                message: existing.status,
                transaction: existing
            });
        }

        throw err;

    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            type: "DEBIT",
            transaction: transaction._id
        }], { session });

        await (() => {
            return new Promise((res, rej) => (setTimeout(() => {
                res()
            }, 10000)));
        })();
        await ledgerModel.create([{
            account: toAccount,
            amount,
            type: "CREDIT",
            transaction: transaction._id
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction
        })
    } catch (err) {
        await session.abortTransaction();
        transaction.status = "PENDING"
        await transaction.save();
        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
            errMessage: err.message
        })
    }
    finally {
        session.endSession();
    }

}


async function createInitialFund(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const isTransactionAlreadyExists = transactionModel.findOne({ idempotencyKey });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount });
    if (!toUserAccount)
        return res.status(400).json({
            message: "Invalid toAccount"
        })

    const fromUser = await userModel.findOne({ _id: req.user._id });
    const fromUserAccount = await accountModel.findOne({ user: fromUser });

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const transaction = await new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            status: "PENDING",
            idempotencyKey
        })

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED"
        await transaction.save({ session });

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction
        })
    } catch (err) {
        await session.abortTransaction()
        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })
    }

}

export default { transactionHandler, createInitialFund };