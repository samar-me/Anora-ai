const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const candidates = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of candidates) {
    try {
      process.stdout.write(`Testing ${model}... `);
      const res = await ai.models.generateContent({
        model,
        contents: 'Salom',
      });
      console.log('SUCCESS! ->', res.text?.trim().substring(0, 40));
    } catch (e) {
      console.log('FAILED:', e.message || e.status);
    }
  }
}

test().catch(console.error);
