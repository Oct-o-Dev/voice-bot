// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/db/mongo');

const voiceRoute = require('./src/routes/voice');
const textRoute = require('./src/routes/text');

const app = express();
const PORT = process.env.PORT || 3001;

// 👇 allow both local dev and deployed Vercel
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'https://voice-bot-opal.vercel.app',       // e.g. https://voice-bot-opal.vercel.app
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow non-browser clients (curl, Postman) which send no Origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed for this origin: ' + origin));
    },
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/voice', voiceRoute);
app.use('/api/text', textRoute);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log('Allowed origins:', allowedOrigins);
    });
  })
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });
