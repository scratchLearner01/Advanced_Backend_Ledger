import accountModel from "../Models/account.model.js";
import ledgerModel from "../Models/ledger.model.js";



async function createAccount(req, res) {

    try {
        const ac = await accountModel.create({
            user: req.user.userid
        })
        return res.status(201).json({ message: "Account created successfully" });
    } catch (err) {
        return res.status(500).json({
            message: "Something went wrong!",
            err: err.message
        });
    }

}

async function getBalance(req, res) {
    try {
        const { fromAccount } = req.query;

        if (!fromAccount) {
            return res.status(400).json({
                message: "fromAccount is required"
            });
        }

        const fromUserAccount = await accountModel.findOne({
            _id: fromAccount,
            user: req.user.userid
        }, { _id: 1 });

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "Account does not exist or does not belong to you"
            });
        }

        const fromLedger = await ledgerModel.find({
            account: fromUserAccount._id
        });

        let debit = 0;
        let credit = 0;

        for (const tran of fromLedger) {
            if (tran.type === "CREDIT") credit += tran.amount;
            else if (tran.type === "DEBIT") debit += tran.amount;
        }

        return res.status(200).json({
            CurrentBalance: credit - debit
        });
    } catch (err) {
        return res.status(500).json({
            message: "Could not fetch balance",
            error: err.message
        });
    }
}

async function allAccounts(req, res) {
    const accounts = await accountModel.find({ user: req.user.userid });

    return res.status(200).json({
        message: "All accounts:-",
        accounts
    })
}

export default { createAccount, getBalance, allAccounts};