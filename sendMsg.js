const cron = require('node-cron');
const nodemailer = require('nodemailer');

//email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.APP_PASSWORD,
    },
});

module.exports = transporter;


