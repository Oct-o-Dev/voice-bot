// backend/src/utils/aiClient.js
require('dotenv').config();
const axios = require('axios');

// --- ENV KEYS ---
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();

// Gemini is optional; we'll keep helper but we won't rely on it
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'text-bison-001').trim();

/**
 * Primary: Groq chat completion
 * Uses OpenAI-compatible endpoint: https://api.groq.com/openai/v1/chat/completions
 */
async function generateWithGroq({
  systemPrompt = '',
  userPrompt = '',
  model = GROQ_MODEL,
  temperature = 0.2,
  maxTokens = 512
}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured in environment');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model,
    messages: [
      systemPrompt
        ? { role: 'system', content: systemPrompt }
        : null,
      { role: 'user', content: userPrompt || '' }
    ].filter(Boolean),
    temperature,
    max_tokens: maxTokens
  };

  try {
    const resp = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      timeout: 120000
    });

    const choice = resp.data?.choices?.[0]?.message?.content;
    if (!choice) {
      throw new Error('Groq API returned no choices');
    }
    return String(choice).trim();
  } catch (err) {
    const bodyStr = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err?.message || String(err);
    throw new Error('Groq error: ' + bodyStr);
  }
}

/**
 * Optional: Gemini text generation (kept only as a backup / future use)
 */
async function generateWithGemini({
  systemPrompt = '',
  userPrompt = '',
  model = GEMINI_MODEL,
  temperature = 0.2,
  maxOutputTokens = 512
}) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  function endpointFor(m) {
    const clean = String(m || '').replace(/^\/+|\/+$/g, '');
    return `https://generativelanguage.googleapis.com/v1beta2/models/${clean}:generateText?key=${GEMINI_API_KEY}`;
  }

  const url = endpointFor(model);
  const body = {
    prompt: { text: `${systemPrompt}\n\n${userPrompt}` },
    temperature,
    maxOutputTokens
  };

  try {
    const resp = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });

    const json = resp.data || {};
    const out =
      json?.candidates?.[0]?.output ||
      json?.candidates?.[0]?.content ||
      (Array.isArray(json?.output) && json.output[0]?.content) ||
      json?.text ||
      JSON.stringify(json);

    if (typeof out === 'object') return JSON.stringify(out);
    return String(out);
  } catch (err) {
    const bodyStr = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err?.message || String(err);
    throw new Error('Gemini error: ' + bodyStr);
  }
}

module.exports = {
  // Groq is the default one we’ll actually use
  generateWithGroq: GROQ_API_KEY ? generateWithGroq : undefined,
  // Gemini is optional; may be undefined if no key
  generateWithGemini: GEMINI_API_KEY ? generateWithGemini : undefined
};
