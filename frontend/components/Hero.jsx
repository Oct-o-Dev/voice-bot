// frontend/components/Hero.jsx
import React from 'react';

export default function Hero({ onTry, onHow }) {
  return (
    <section className="min-h-[48vh] flex items-center py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-5xl font-display font-extrabold text-white leading-tight">
          Simplotel Voice Bot <span style={{ display:'inline-block', width:36, height:6, background: 'linear-gradient(90deg,#00e6ff,#ff4dd2)', marginLeft:14, borderRadius:6 }} />
        </h1>

        <p className="mt-6 max-w-3xl text-gray-300 text-lg">
          A hotel-focused voice assistant that answers guest queries instantly. Try it live — ask about check-in, wifi, breakfast or cancellation.
        </p>

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={onTry}
            className="btn-neon"
            aria-label="Try the demo"
            style={{ minWidth:140 }}
          >
            Try the demo
          </button>

          <button
            onClick={onHow}
            className="btn-outline"
            aria-label="How it works"
            style={{ padding: '10px 14px' }}
          >
            How it works
          </button>
        </div>

        <div className="mt-12 card p-4" style={{ maxWidth: '100%' }}>
          <div className="text-sm text-gray-300">Demo connected to Groq LLM • Dark Cyberpunk UI</div>
        </div>
      </div>
    </section>
  );
}
