import nodemailer from "nodemailer"
import "dotenv/config"

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.GOOGLE_APP_PASSWORD

    }

});

transporter.verify()
    .then(()=>(console.log("verified with SMTP")))
    .catch(console.error)


export async function sendWelcomeEmail(email, name,sub,txt) {

    const info = await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: email,

        subject: sub,

        text: txt

    });
    console.log(info);
    
}

export default {sendWelcomeEmail};