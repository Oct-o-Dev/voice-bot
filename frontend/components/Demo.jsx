// frontend/components/Demo.jsx
'use client'
import { useState } from 'react'
import SpeechToText from './SpeechToText'
import axios from 'axios'
import { getConversationId } from '../utils/conversation'


export default function Demo(){
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  // callback for speech component
  function handleResult(data){
    if (!data) return;
    setTranscript(data.transcript || '');
    setReply(data.reply || '');
  }

  // Demo.jsx (send handler)
    async function handleSendManual(text) {
    console.log('handleSendManual called, text:', JSON.stringify(text));
    if (!text || !text.trim()) {
        console.warn('Won’t send empty transcript');
        setReply("Please type or speak a question first.");
        return;
    }
    setLoading(true);
    try {
        const convId = getConversationId();
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        console.log('Sending to backend:', { transcript: text, conversationId: convId });
        const res = await axios.post(`${backend}/api/text`, { transcript: text, conversationId: convId });
        console.log('Backend response:', res.data);
        setTranscript(res.data.transcript);
        setReply(res.data.reply);
    } catch(err) {
        console.error('send error', err);
        setReply('Server error');
    } finally {
        setLoading(false);
    }
    }


  return (
    <section className="section">
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <h3 className="kicker">Record or type</h3>
          <div className="lead">Use your browser's speech recognition (Chrome/Edge) or type a quick question.</div>

          <div style={{ marginTop: 16 }}>
            <SpeechToText
            onInterim={(t)=>setTranscript(t)}
            onResult={(data)=>{ setTranscript(data.transcript); setReply(data.reply); }}
            />


            <div style={{ marginTop: 18 }}>
              <textarea
                placeholder="Type your question (e.g. 'What time is check-in?')"
                value={transcript}
                onChange={(e)=>setTranscript(e.target.value)}
              />
              <div style={{ display:'flex', gap:12, marginTop:12 }}>
                <button
                    className="btn-neon"
                    onClick={() => handleSendManual(transcript)}
                    disabled={loading || !String(transcript || '').trim()}
                    >
                    {loading ? 'Thinking...' : 'Send'}
                </button>


                <button className="btn-outline" onClick={()=>{ setTranscript(''); setReply('') }}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginTop: 18 }}>
          <h3 className="kicker">Bot Reply</h3>
          <div className="reply-box" style={{ marginTop: 12 }}>
            { loading ? <em>Thinking…</em> : (reply || <em>No reply yet</em>) }
          </div>
        </div>
      </div>
    </section>
  )
}
