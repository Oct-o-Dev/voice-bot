// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/db/mongo');

const voiceRoute = require('./src/routes/voice'); // optional voice upload route
const textRoute = require('./src/routes/text');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/voice', voiceRoute);
app.use('/api/text', textRoute);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Try connecting to DB, then start the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // connectDB won't throw on failure in our implementation, but keep this defensive
    console.error('Startup error:', err);
    process.exit(1);
  });
