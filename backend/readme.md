<!-- # Simplotel Voice Bot - Backend


Node.js + Express backend providing:
- /api/voice : accepts audio (multipart/form-data) and returns transcript + LLM reply
- Health check: /health


## Setup
1. Copy `.env.example` to `.env` and fill values (MONGODB_URI, OPENAI_API_KEY, FRONTEND_URL).
2. Install dependencies:
```bash
npm install
```
3. Seed FAQs (optional but recommended):
```bash
npm run seed
```
4. Run in dev mode:
```bash
npm run dev
```


## Endpoint example
POST /api/voice
Form-data: audio file field named `audio` (type: file)


Response JSON:
```
{
"transcript": "...",
"reply": "..."
}
```


## Notes
- This starter uses OpenAI Whisper via the REST audio/transcriptions endpoint. Ensure your OpenAI account has access.
- The LangChain/OpenAI call may need small adjustments depending on the exact SDK versions you install. If you encounter SDK mismatch errors, you can switch to direct OpenAI REST calls. -->