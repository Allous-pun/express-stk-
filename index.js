const express = require("express");
const app = express();

require("dotenv").config();
const cors = require("cors");
const axios = require("axios");

// Define the generateToken function
const generateToken = async (req, res, next) => {
  const secretKey = process.env.SAFARICOM_CONSUMER_SECRET;
  const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");

  try {
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    );
    req.token = response.data.access_token;
    next();
  } catch (e) {
    console.error('Error details:', e.response ? e.response.data : e.message);
    res.status(500).json({ error: "Error generating token" });
  }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Define routes
app.get('/', (req, res) => {
  res.send('Welcome to the M-Pesa API');
});

app.get("/home", (req, res) => {
  return res.status(200).send({ message: "Hello jesse" });
});

app.get("/token", generateToken, (req, res) => {
  res.status(200).json({ token: req.token });
});

app.post("/stk", generateToken, async (req, res) => {
  const phone = req.body.phone.substring(1);
  const amount = req.body.amount;
  const date = new Date();
  const timeStamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);
  const shortCode = process.env.BUSINESS_SHORT_CODE;
  const passKey = process.env.PASS_KEY;
  const password = Buffer.from(shortCode + passKey + timeStamp).toString("base64");

  if (!req.token) {
    return res.status(400).json({ error: "Token not available" });
  }

  try {
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timeStamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${phone}`,
        PartyB: shortCode,
        PhoneNumber: `254${phone}`,
        CallBackURL: "https://f172-105-161-112-136.ngrok-free.app/callback",
        AccountReference: `Mlosafi`,
        TransactionDesc: "Mlosafi",
      },
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Error details:', err.response ? err.response.data : err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/callback", (req, res) => {
  console.log("In callback");
  const callbackData = req.body;
  console.log("Callback data is", callbackData);
  res.status(200).send('Callback received');
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
