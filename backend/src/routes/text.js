// backend/src/routes/text.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { mongoose } = require('../db/mongo');
const Interaction = require('../models/Interaction');

const { generateWithGemini, generateWithGroq } = require('../utils/aiClient') || {};

const SYSTEM_PROMPT = `You are a helpful hotel voice assistant for Simplotel. Keep answers short and friendly.`;

// --- DB helpers ---
function isDbConnected() {
  return mongoose && mongoose.connection && mongoose.connection.readyState === 1;
}

async function loadRecentMessages(conversationId, n = 8) {
  if (!isDbConnected() || !conversationId) return [];
  try {
    return await Interaction.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(n)
      .lean();
  } catch (err) {
    console.warn('Could not load interactions:', err?.message || err);
    return [];
  }
}

function buildPrompt(systemPrompt, recentMessages) {
  const msgs = (recentMessages || []).slice().reverse();
  const parts = [systemPrompt, '\nConversation history:'];
  msgs.forEach(m => {
    const who =
      m.role === 'user'
        ? 'User'
        : m.role === 'assistant'
        ? 'Assistant'
        : 'System';
    parts.push(`${who}: ${m.text}`);
  });
  parts.push('\nUser:'); // latest user text will be appended after this
  return parts.join('\n');
}

// --- Fallback generators ---
function fallbackReply(userText) {
  return `I heard: "${String(userText).slice(
    0,
    200
  )}". I'm having trouble contacting the language service right now — please try again in a moment.`;
}

// Simple deterministic FAQ for core hotel questions
function faqFallback(transcript) {
  if (!transcript) return null;
  const t = transcript.toLowerCase();
  if (t.includes('check-in') || t.includes('check in') || t.includes('checkin')) {
    return 'Standard check-in time is 3:00 PM. Early check-in may be available on request.';
  }
  if (t.includes('wifi') || t.includes('wi-fi') || t.includes('internet')) {
    return 'Yes — complimentary Wi-Fi is available for guests. Connect to our guest network at check-in.';
  }
  if (t.includes('breakfast')) {
    return 'Breakfast is served 7:00–10:30 AM in the dining area on the ground floor.';
  }
  if (t.includes('cancellation') || t.includes('cancel')) {
    return 'Cancellation policy varies by rate — typically free cancellation up to 24 hours before arrival. Check your booking confirmation for details.';
  }
  if (t.includes('parking')) {
    return 'We offer on-site parking for a daily fee. Please contact reception for availability.';
  }
  return null;
}

// --- Route ---
router.post('/', async (req, res) => {
  const { transcript: rawTranscript, conversationId: incomingConv } = req.body || {};
  console.log('Received /api/text body:', req.body);

  const transcript = rawTranscript ? String(rawTranscript) : '';

  try {
    // 1) Handle empty text early (no LLM call)
    if (!transcript.trim()) {
      const conversationId =
        incomingConv && String(incomingConv).trim()
          ? incomingConv
          : uuidv4();
      return res.json({
        transcript: '',
        reply:
          "It seems like you didn't type or say a question. Please ask a quick question (e.g., 'What time is check-in?').",
        conversationId
      });
    }

    const conversationId =
      incomingConv && String(incomingConv).trim() ? incomingConv : uuidv4();

    // 2) Save user message
    if (isDbConnected()) {
      try {
        await Interaction.create({
          conversationId,
          role: 'user',
          text: transcript
        });
      } catch (e) {
        console.warn('Failed to save user interaction:', e?.message || e);
      }
    } else {
      console.log('DB not connected: skipping save for user message');
    }

    // 3) Rule-based hotel FAQ first (super fast)
    const rule = faqFallback(transcript);
    if (rule) {
      if (isDbConnected()) {
        try {
          await Interaction.create({
            conversationId,
            role: 'assistant',
            text: rule
          });
        } catch (e) {
          console.warn(
            'Failed to save assistant FAQ interaction:',
            e?.message || e
          );
        }
      }
      return res.json({ transcript, reply: rule, conversationId });
    }

    // 4) Build context prompt with history for LLM
    const recent = await loadRecentMessages(conversationId, 8);
    const contextPrompt =
      buildPrompt(SYSTEM_PROMPT, recent) + '\n' + 'User: ' + transcript;

    console.log('Final LLM prompt (start):', contextPrompt.slice(0, 1000));

    // 5) Call LLMs in order: Groq first, then Gemini optional
    let reply;
    try {
      if (typeof generateWithGroq === 'function') {
        // PRIMARY: Groq
        reply = await generateWithGroq({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: contextPrompt
        });
      } else if (typeof generateWithGemini === 'function') {
        // Backup: Gemini (only if you configured it)
        reply = await generateWithGemini({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: contextPrompt
        });
      } else {
        throw new Error(
          'No LLM configured (generateWithGroq / generateWithGemini missing).'
        );
      }
    } catch (e) {
      console.error('LLM call failed:', e?.message || e);
      reply = fallbackReply(transcript);
    }

    // 6) Save assistant reply
    if (isDbConnected()) {
      try {
        await Interaction.create({
          conversationId,
          role: 'assistant',
          text: reply
        });
      } catch (e) {
        console.warn('Failed to save assistant interaction:', e?.message || e);
      }
    } else {
      console.log('DB not connected: skipping save for assistant reply');
    }

    return res.json({ transcript, reply, conversationId });
  } catch (err) {
    console.error(
      'Text route unexpected error:',
      err && (err.stack || err.message) ? err.stack || err.message : err
    );
    return res.status(500).json({
      error: 'Server error processing text request. Check server logs.'
    });
  }
});

module.exports = router;
