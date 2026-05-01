const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
    // For development, we log to console if no SMTP is provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("------------------------------------------");
        console.log("MOCK EMAIL SENT TO:", to);
        console.log("SUBJECT:", subject);
        console.log("CONTENT:", text);
        console.log("------------------------------------------");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Hidden Path" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
    });
};

module.exports = sendEmail;
