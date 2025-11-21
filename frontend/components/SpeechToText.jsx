// frontend/components/SpeechToText.jsx
'use client';
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { getConversationId } from '../utils/conversation';

export default function SpeechToText({ onResult, onInterim }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef(null);

  const supports = typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  function initRecognition() {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = async (e) => {
    let final = '';
    let inter = '';
    for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else inter += r[0].transcript;
    }
    // inside rec.onresult
    const shown = inter || final;
    setInterim(shown);
    if (typeof onInterim === 'function') onInterim(shown);

    if (final.trim()) {
    onInterim?.(final.trim()); // ensure parent transcript set immediately
    await sendTranscript(final.trim());
    setInterim('');
    }


    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = (err) => {
      console.error('SpeechRecognition error', err);
      setListening(false);
    };

    recognitionRef.current = rec;
    return rec;
  }

  function start() {
    const r = initRecognition();
    if (!r) {
      alert('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }
    setInterim('');
    setListening(true);
    try { r.start(); } catch (e) { console.warn('start() failed', e); }
  }

  function stop() {
    const r = recognitionRef.current;
    if (r && r.stop) r.stop();
    recognitionRef.current = null; // re-create next time
    setListening(false);
    }

  async function sendTranscript(text) {
    try {
      const convId = getConversationId();
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await axios.post(`${backend}/api/text`, { transcript: text, conversationId: convId });
      const data = res.data;
      onResult?.(data);
      // speak reply with browser TTS
      if (data?.reply && 'speechSynthesis' in window) {
        const ut = new SpeechSynthesisUtterance(data.reply);
        // optional voice selection
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(ut);
      }
    } catch (err) {
      console.error('sendTranscript error', err);
      onResult?.({ transcript: text, reply: 'Server error' });
    }
  }

  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <button onClick={start} disabled={!supports || listening} className="btn-neon">
          {listening ? 'Listening…' : 'Start Voice Query'}
        </button>
        <button onClick={stop} disabled={!listening} className="btn-outline">Stop</button>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{supports ? '' : 'Speech recognition not supported'}</div>
      </div>

      <div style={{ marginTop:12 }}>
        <div style={{ minHeight:48, padding:12, borderRadius:8, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <em>{interim || 'No transcript yet'}</em>
        </div>
      </div>
    </div>
  );
}
