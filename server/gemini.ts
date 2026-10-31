/**
 * Campus Pulse - Gemini Model Resilience & Fallback Protocol
 * Implements automated multi-model ladder for notice summarization and duplicate detection.
 */

import { GoogleGenAI } from '@google/genai';

// Resilient Model Fallback Ladder ordered by latency and availability
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Standard Helper: executes prompt generation through the fallback ladder.
 */
export async function generateContentWithFallback(prompt: string): Promise<string> {
  const client = getAiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured or using placeholder value.');
  }

  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE');

      console.warn(`[Gemini Fallback] Model ${model} encountered error (status: ${status}). Recoverable: ${isRecoverable}`);
      if (!isRecoverable && status !== 0) {
        // Continue fallback attempts anyway to ensure system resilience
      }
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${(lastError as any)?.message || 'Unknown error'}`);
}

/**
 * Summarizes official college notices into 3 student-focused bullet points.
 */
export async function summarizeNoticeWithAi(title: string, description: string): Promise<string> {
  const prompt = `You are the AI Assistant for Campus Pulse, a centralized college communication portal.
Summarize the following official college update into exactly 3 clear, action-oriented bullet points for students.
Keep it strictly under 50 words total. Do not add conversational fluff.

Title: ${title}
Content:
${description}

Output format:
• [Key Action / Takeaway 1]
• [Important Date / Requirement 2]
• [Next Step / Contact 3]`;

  return await generateContentWithFallback(prompt);
}

/**
 * Checks for semantic duplicate notice between a newly drafted notice and existing active titles.
 */
export async function checkSemanticDuplicateWithAi(
  newTitle: string,
  newDescription: string,
  existingTitles: string[]
): Promise<{ isDuplicate: boolean; matchedTitle?: string; reason?: string }> {
  if (existingTitles.length === 0) {
    return { isDuplicate: false };
  }

  const prompt = `Analyze if this newly drafted college notice is a duplicate or conveys the same information as any of the existing notice titles listed below.

New Notice Title: "${newTitle}"
New Notice Content: "${newDescription}"

Existing Active Notices:
${existingTitles.slice(0, 20).map((t, i) => `${i + 1}. "${t}"`).join('\n')}

Respond in valid JSON format only:
{
  "isDuplicate": true or false,
  "matchedTitle": "exact matched title or null",
  "reason": "short explanation of why it is or is not a duplicate"
}`;

  try {
    const raw = await generateContentWithFallback(prompt);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      isDuplicate: !!parsed.isDuplicate,
      matchedTitle: parsed.matchedTitle || undefined,
      reason: parsed.reason || undefined,
    };
  } catch {
    // If AI fails or returns non-JSON, fallback safely to false
    return { isDuplicate: false };
  }
}
