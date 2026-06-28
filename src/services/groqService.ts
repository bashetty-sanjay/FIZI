export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const generateChatResponse = async (messages: ChatMessage[]) => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API Error:', errorData);
      throw new Error(`Groq API returned status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I am having trouble responding right now.';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

/**
 * Generate a concise, motivating workout summary using Groq
 */
export const generateWorkoutSummary = async (stats: {
  reps: number;
  time: string;
  formScore: number;
  exerciseName: string;
  feedback: string[];
}) => {
  const prompt = `
    Generate a concise (max 2 sentences), highly motivating workout summary for a fitness app.
    Exercise: ${stats.exerciseName}
    Reps: ${stats.reps}
    Time: ${stats.time}
    Average Form Score: ${stats.formScore}%
    Form Feedback: ${stats.feedback.join(', ') || 'Perfect form!'}
    
    The tone should be encouraging, professional, and energetic. Focus on the achievement.
    Directly return the text to be spoken by text-to-speech.
  `;

  return generateChatResponse([
    { role: 'system', content: 'You are an elite AI fitness coach providing motivating post-workout summaries.' },
    { role: 'user', content: prompt }
  ]);
};

/**
 * Generate a short, actionable correction tip using Groq
 */
export const generateRealTimeCorrection = async (errors: string[]) => {
  if (!errors || errors.length === 0) return null;

  const prompt = `
    Based on these form errors: ${errors.join(', ')}
    Provide ONE short (max 10 words), actionable correction tip for a person currently doing the exercise.
    Example: "Keep your back straight and core tight."
    Directly return only the correction text.
  `;

  return generateChatResponse([
    { role: 'system', content: 'You are an AI fitness coach providing immediate, short form correction tips.' },
    { role: 'user', content: prompt }
  ]);
};
