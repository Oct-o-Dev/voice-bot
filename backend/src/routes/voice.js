// src/routes/voice.js
const express = require('express');
const multer = require('multer');
const upload = multer();
const { transcribeBuffer, generateWithGemini } = require('../utils/aiClient');
const { getDB } = require('../db/mongo');

const router = express.Router();

function extractKeywords(text, k = 6) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, k);
}

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No audio uploaded' });

    // 1) Transcribe
    const transcript = await transcribeBuffer(req.file.buffer, { filename: req.file.originalname || 'audio.wav' });

    // 2) Retrieve relevant FAQs from Mongo
    let faq_snippets = '';
    try {
      const db = getDB();
      const faqs = db.collection('faqs');
      const keywords = extractKeywords(transcript, 6);
      if (keywords.length) {
        const or = keywords.map((k) => ({ question: { $regex: k, $options: 'i' } }));
        const found = await faqs.find({ $or: or }).limit(4).toArray();
        faq_snippets = found.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      }
    } catch (e) {
      console.warn('FAQ lookup failed', e.message);
    }

    // 3) Generate reply using Gemini
    const systemPrompt = 'You are SimplotelBot, a concise and helpful hotel assistant. Use provided FAQ context when relevant.';
    const userPrompt = `Context: ${faq_snippets || 'None'}\n\nUser said: ${transcript}\n\nRespond in 2-4 sentences. If the user asked for missing info, ask a clarifying question.`;

    const reply = await generateWithGemini({ systemPrompt, userPrompt, model: process.env.GEMINI_MODEL || 'text-bison-001', maxOutputTokens: 300, temperature: 0.2 });

    // 4) save interaction (non-blocking)
    try {
      const db = getDB();
      await db.collection('interactions').insertOne({ transcript, reply, createdAt: new Date() });
    } catch (e) {
      console.warn('Could not save interaction', e.message);
    }

    res.json({ transcript, reply });
  } catch (err) {
    console.error('Voice route error', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
