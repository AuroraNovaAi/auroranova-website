'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateText(prompt: string, modelName: string = 'gemini-2.5-flash') {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in .env.local');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, text };
  } catch (error: any) {
    console.error('[Server Action Error] AI Text Generation Failed:', error);
    return { success: false, error: error.message || 'Bilinmeyen bir hata oluştu.' };
  }
}
