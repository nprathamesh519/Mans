const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL   = 'gemini-2.0-flash';
const BASE    = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const generate = async (prompt: string): Promise<string> => {
  if (!API_KEY) return 'AI is not configured. Please add VITE_GEMINI_API_KEY to .env';

  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export class AIService {

  static async askAssistant(query: string, context?: {
    faces?: any[];
    memories?: any[];
    reminders?: any[];
    userName?: string;
  }) {
    const userName  = context?.userName  || 'the patient';
    const faces     = context?.faces     || [];
    const memories  = context?.memories  || [];
    const reminders = context?.reminders || [];

    const prompt = `You are Lucidia, a warm and gentle AI assistant helping an Alzheimer's patient named ${userName}.
Speak simply, clearly, and with kindness. Keep answers short and easy to understand.

Known people:
${faces.length > 0
  ? faces.map((f: any) => `- ${f.name} (${f.relation})${f.notes ? ': ' + f.notes : ''}`).join('\n')
  : '- No people added yet'}

Recent memories:
${memories.length > 0
  ? memories.slice(0, 5).map((m: any) => `- ${m.title}${m.description ? ': ' + m.description : ''}`).join('\n')
  : '- No memories added yet'}

Upcoming reminders:
${reminders.filter((r: any) => !r.isCompleted).length > 0
  ? reminders.filter((r: any) => !r.isCompleted).slice(0, 3).map((r: any) => `- ${r.title} at ${new Date(r.time).toLocaleTimeString()}`).join('\n')
  : '- No upcoming reminders'}

Patient asks: ${query}

Answer kindly and simply using the above context when relevant.`;

    return generate(prompt);
  }

  static async narrateMemory(memory: any, userName: string) {
    const prompt = `Convert this memory into a short, warm, emotional story in 3-4 sentences for ${userName} who has Alzheimer's.
Title: ${memory.title}
Description: ${memory.description || ''}
Keep it simple, positive and comforting.`;

    return generate(prompt);
  }

  static async createVideoMemory(memory: any) {
    return {
      done: true,
      response: {
        generatedVideos: [{ video: { uri: memory.imageUrl } }]
      }
    };
  }

  static async analyzeLocation(lat: number, lng: number, userName: string): Promise<{ text: string; sources: any[] }> {
    const prompt = `Briefly describe (2-3 sentences) the likely surroundings near latitude ${lat}, longitude ${lng} for ${userName}, an Alzheimer's patient. Be reassuring.`;
    const text = await generate(prompt);
    return { text, sources: [] };
  }
}
