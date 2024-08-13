const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to handle the callback from M-Pesa
app.post('/callback', (req, res) => {
  // Log the callback data to the console for debugging
  console.log("In callback");
  const callbackData = req.body;
  console.log("Callback data is", callbackData);

  // You might want to process the callback data here, e.g., save to a database

  // Respond to M-Pesa with an HTTP 200 status to acknowledge receipt
  res.status(200).send('Callback received');
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});

const port = process.env.CALLBACK_PORT || 3001;
app.listen(port, () => {
  console.log(`Callback service is running on port ${port}`);
});
