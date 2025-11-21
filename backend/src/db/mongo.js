// backend/src/db/mongo.js
const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    console.warn('MONGODB_URI not provided; continuing without DB connection.');
    return;
  }

  const opts = {
    // useNewUrlParser/useUnifiedTopology are no-ops in recent drivers but harmless to list
    // serverSelectionTimeoutMS helps fail fast if DB unreachable
    serverSelectionTimeoutMS: 5000,
  };

  try {
    await mongoose.connect(uri, opts);
    console.log('Connected to MongoDB');
  } catch (err) {
    // Non-fatal: we log and continue — routes will check connection state before DB ops
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
  }
}

// Export mongoose for routes/models to inspect connection state
module.exports = { connectDB, mongoose };
