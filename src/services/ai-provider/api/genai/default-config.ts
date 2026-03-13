import { type GenerateContentConfig, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { z } from 'zod/v4';

export const defaultConfig: GenerateContentConfig = {
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ],
  temperature: 1,
  topP: 0.95,
  responseModalities: ['text']
};

export const GeminiModelSchema = z.enum([
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
]);

export type GeminiModel = z.infer<typeof GeminiModelSchema>;
