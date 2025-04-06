const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Oauth2
const Oauth2 = google.auth.OAuth2;
const oauth2Client = new Oauth2(
    process.env.MAIL_CLIENT_ID,
    process.env.MAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: process.env.MAIL_CLIENT_REFRESH_TOKEN
});

// mail yvuulah medeelel oruulan
const mailSender = async (fromMail, toMail, mail_subject, mail_text) => {
    try {
        const accessToken = await oauth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_USER,
                clientId: process.env.MAIL_CLIENT_ID,
                clientSecret: process.env.MAIL_CLIENT_SECRET,
                refreshToken: process.env.MAIL_CLIENT_REFRESH_TOKEN,
                accessToken: accessToken.token
            },
            tls: {
                rejectUnauthorized: true
            }
        });
        const emailOptions = {
            from: fromMail,
            to: toMail,
            subject: mail_subject,
            text: mail_text
        };
        const sendResult = await transporter.sendMail(emailOptions);
        console.log('Email sent: ', sendResult);
        return sendResult;
    } catch (err) {
        console.log("Error on Mail:", err);
        throw new Error('Email sending failed');
    }
};

module.exports = mailSender;