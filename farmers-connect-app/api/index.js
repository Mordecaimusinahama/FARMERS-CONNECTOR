const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Sample eCommerce route
app.get('/api/listings', (req, res) => {
  res.json([
    { id: 1, name: 'Maize', price: 20 },
    { id: 2, name: 'Wheat', price: 30 },
  ]);
});

// Sample chatbot route
app.post('/api/chatbot', (req, res) => {
  const { message } = req.body;
  res.json({ reply: `AI says: You asked about '${message}'` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`)); 