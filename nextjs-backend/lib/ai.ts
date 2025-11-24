import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FeedbackAnalysis {
    priority: FeedbackPriority;
    analysis: string;
    category?: string;
}

export async function analyzeFeedback(title: string, description: string): Promise<FeedbackAnalysis> {
    if (!process.env.GROQ_API_KEY) {
        console.warn('GROQ_API_KEY is not set. Defaulting to MEDIUM priority.');
        return {
            priority: 'MEDIUM',
            analysis: 'AI analysis unavailable (missing API key).',
        };
    }

    try {
        const prompt = `
      Analyze the following employee feedback and determine its priority level and category.
      
      Feedback Title: "${title}"
      Feedback Description: "${description}"
      
      Priority Levels:
      - URGENT: Safety issues, harassment, legal risks, immediate blockers, severe misconduct.
      - HIGH: Major workflow issues, significant dissatisfaction, equipment failure affecting work.
      - MEDIUM: Suggestions for improvement, minor inconveniences, general feedback.
      - LOW: Minor aesthetic issues, nice-to-haves, non-critical comments.
      
      Categories: GENERAL, WORKPLACE, MANAGEMENT, BENEFITS, CULTURE, OTHER.

      Respond ONLY with a JSON object in the following format:
      {
        "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
        "analysis": "Brief explanation of why this priority was assigned (max 1 sentence).",
        "category": "Category from the list above"
      }
    `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an HR AI assistant that analyzes employee feedback to help prioritization. You always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from Groq API');
        }

        const result = JSON.parse(content);

        // Validate priority
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const priority = validPriorities.includes(result.priority) ? result.priority : 'MEDIUM';

        return {
            priority: priority as FeedbackPriority,
            analysis: result.analysis || 'No analysis provided.',
            category: result.category,
        };
    } catch (error) {
        console.error('Error analyzing feedback with Groq:', error);
        return {
            priority: 'MEDIUM',
            analysis: 'AI analysis failed. Please review manually.',
        };
    }
}
