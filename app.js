
const express = require('express');
const mongoose = require('mongoose'); 
require('dotenv').config();

const path = require('path'); //to access assets. here views
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');

const Reminder = require('./models/reminder');

const transporter = require('./sendMsg');

//Express instance
const app = express();

//middlware
app.use(express.urlencoded({ extended: true }));  //pass data from html form
app.use(express.json());  //handling json data
app.use(cors());

//set ejs template engine -> follows html syntax
app.set('view engine', 'ejs');
//set views folder
app.set('views', path.join(__dirname, 'views'));



app.use(expressLayouts);
app.set('layout', 'layout');

//connect DB
mongoose.connect(process.env.MONGODB_STRING)
    .then(()=>{
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log(`Error: connecting to mongodb: ${error.message}`);
    });


//Routes:
//! home page
app.get('/', (req, res)=>{
    res.render("index", {
        title: 'Email Reminder',
        currentPage: 'home',
    });
});

//! about page
app.get('/about', (req, res)=>{
    res.render('about', {
        title: "About - Email Reminder App",
        currentPage: "about",
    });
});

//! page to show schedule form
app.get('/schedule', (req, res)=>{
    res.render('schedule', {
        title: "Schedule Reminder",
        currentPage: "schedule",
    });
});

//! actual logic for scheduling of reminder
app.post('/schedule', async (req, res)=>{
    try{
        const { email, message, datetime } = req.body;
    
        const reminder = new Reminder({
            email,
            message,
            scheduledTime: new Date(datetime),
        });
        await reminder.save();
        res.redirect('/schedule?success=true')
    } catch(error){
        console.log(error);
        res.redirect('/schedule?error=true')
    }
});

app.get('/reminders', async(req, res)=>{
    try{
        const reminders = await Reminder.find().sort({ scheduledTime: 1 });
        res.render('reminders', {
            reminders,
            title: 'Schedule reminders',
            currentPage: 'reminders',
        });
    } catch(err){
        res.redirect('/error=true');
    }
}
);

//cron job to check and send reminders
cron.schedule('* * * * *', async()=>{
    try{
        const now = new Date();
        const reminders = await Reminder.find({
              scheduledTime: { $lte: now },  //you send this message
               sent: false,
        }); 
         for(const reminder of reminders){
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: reminder.email,
                text: reminder.message,
                subject: 'Reminder App',
            });
            reminder.sent = true;
            await reminder.save();
         }
    }catch(err){
        console.log(`Error sending reminders`, err);
    }
})


//start the server
const PORT = process.env.PORT || 5000;    
app.listen(PORT, console.log(`Server is running on port: ${PORT}`));   

