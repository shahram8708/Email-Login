const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto'); 
const ejs = require('ejs');

const app = express();
const port = 3000;

const secretKey = crypto.randomBytes(32).toString('hex');

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ram.coding8@gmail.com', 
    pass: 'lkbf nrwm pmno xqdh'
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

const otpStorage = {};

app.post('/sendOTP', (req, res) => {
  const email = req.body.email;
  const otp = generateOTP();
  
  if (!email) {
    return res.status(400).send('Recipient email address is required');
  }

  const mailOptions = {
    from: 'ram.coding8@gmail.com',
    to: email,
    subject: 'Your OTP for login',
    text: `Your OTP is: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Failed to send OTP');
    } else {
      console.log('Email sent: ' + info.response);
      otpStorage[email] = otp.toString(); 
      req.session.email = email; 
      res.status(200).send('OTP sent successfully');
    }
  });
});

app.post('/verifyOTP', (req, res) => {
  const email = req.session.email; 
  const otp = req.body.otp.toString(); 
  
  if (!email || !otp) {
    return res.status(400).send('Email and OTP are required');
  }

  const storedOTP = otpStorage[email];
  if (!storedOTP || storedOTP !== otp) {
    return res.status(401).send('Invalid OTP');
  }

  delete otpStorage[email];
  
  res.cookie('user_email', email, { maxAge: 31536000000, httpOnly: true }); 

  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    const email = req.session.email; 
    if (!email) {
      return res.redirect('/');
    }
    res.render('dashboard', { userEmail: email });
  });

app.get('/', (req, res) => {
  const email = req.session.email;
  if (email) {
    return res.redirect('/dashboard'); 
  }
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
