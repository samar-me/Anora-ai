const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const testTool = {
  functionDeclarations: [
    {
      name: 'create_expense',
      description: 'Record an expense',
      parameters: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER, description: 'Amount in UZS' },
          category: { type: Type.STRING, description: 'Category' },
          description: { type: Type.STRING, description: 'Description' },
        },
        required: ['amount'],
      },
    },
  ],
};

async function test() {
  const chat = ai.chats.create({
    model: 'gemini-3.5-flash',
    config: {
      tools: [testTool],
    },
  });

  const res1 = await chat.sendMessage({ message: '15 ming tushlikka sarfladim' });
  console.log('Turn 1 calls:', res1.functionCalls);

  if (res1.functionCalls && res1.functionCalls.length > 0) {
    const fc = res1.functionCalls[0];
    const res2 = await chat.sendMessage({
      message: [
        {
          functionResponse: {
            name: fc.name,
            response: { success: true, message: '15 000 so\'m saqlandi' },
          },
        },
      ],
    });
    console.log('Turn 2 response:', res2.text);
  }
}

test().catch(console.error);
