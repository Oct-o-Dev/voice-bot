import { useState, useRef } from 'react';
import axios from 'axios';

export default function Recorder({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setRecording(true);
    setLoading(false);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setLoading(true);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const form = new FormData();
        form.append('audio', blob, 'recording.wav');

        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          const res = await axios.post(`${backendUrl}/api/voice`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const { transcript, reply } = res.data;
          onResult({ transcript, reply });

          // Speak reply via browser TTS
          if (reply && 'speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(reply);
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utter);
          }
        } catch (err) {
          console.error('Upload error', err?.response || err?.message || err);
          onResult({ error: 'Failed to process audio' });
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Mic error', err);
      onResult({ error: 'Microphone permission denied or not available' });
      setRecording(false);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12 }}>
        {!recording ? (
          <button onClick={startRecording} style={{ padding: '8px 12px' }}>
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} style={{ padding: '8px 12px' }}>
            Stop Recording
          </button>
        )}
        <div style={{ alignSelf: 'center' }}>{loading ? 'Processing...' : ''}</div>
      </div>
    </div>
  );
}