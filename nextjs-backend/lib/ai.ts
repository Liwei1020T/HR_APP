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

export interface AISuggestedReply {
    suggestedReply: string;
    tone: string;
}

export interface AdminReportRequest {
    timeframe: string;
    total: number;
    resolved: number;
    urgent: number;
    open: number;
    avgResponseHours: number;
    statusBreakdown: Record<string, number>;
    recentHighlights: Array<{ title: string; priority: string; status: string; category: string }>;
}

export interface AdminReportResponse {
    summary: string;
    insights: string[];
}

export async function generateAdminReport(data: AdminReportRequest): Promise<AdminReportResponse> {
    if (!process.env.GROQ_API_KEY) {
        console.warn('GROQ_API_KEY is not set. Cannot generate admin report.');
        return {
            summary: 'AI report unavailable (missing API key).',
            insights: ['Please configure GROQ_API_KEY to enable AI-generated reports.'],
        };
    }

    try {
        const prompt = `
You are an HR analytics assistant. Given feedback stats for the timeframe "${data.timeframe}", write a concise, actionable report.

Data:
- Total feedback: ${data.total}
- Open (not resolved/closed): ${data.open}
- Resolved/Closed: ${data.resolved}
- Urgent open: ${data.urgent}
- Avg response time (hours): ${data.avgResponseHours}
- Status breakdown: ${JSON.stringify(data.statusBreakdown)}
- Recent highlights (priority / status / category : title):
  ${data.recentHighlights.map((h) => `${h.priority} / ${h.status} / ${h.category}: ${h.title}`).join('\n  ')}

Respond ONLY with JSON:
{
  "summary": "<3-4 sentence overall summary with timeframe and key metrics>",
  "insights": [
    "<specific action or risk about urgent/open items>",
    "<trend or bottleneck to address>",
    "<positive signal or recommendation>"
  ]
}
Keep it specific and concise, mention timezone as UTC+8 in the summary.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an HR analytics assistant. Respond with JSON only.' },
                { role: 'user', content: prompt },
            ],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.4,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content received from Groq');
        const result = JSON.parse(content);

        return {
            summary: result.summary || 'AI report unavailable.',
            insights: Array.isArray(result.insights) ? result.insights : [],
        };
    } catch (error) {
        console.error('Error generating admin report with Groq:', error);
        return {
            summary: 'AI report failed.',
            insights: ['Please retry in a few moments.'],
        };
    }
}

export async function generateReplySuggestion(
    feedbackTitle: string,
    feedbackDescription: string,
    feedbackCategory: string,
    conversationHistory?: Array<{ author: string; message: string }>
): Promise<AISuggestedReply> {
    if (!process.env.GROQ_API_KEY) {
        console.warn('GROQ_API_KEY is not set. Cannot generate AI reply.');
        return {
            suggestedReply: 'Thank you for your feedback. We are reviewing your concerns and will get back to you soon.',
            tone: 'professional',
        };
    }

    try {
        const historyContext = conversationHistory && conversationHistory.length > 0
            ? `\n\nConversation History:\n${conversationHistory.map(h => `${h.author}: ${h.message}`).join('\n')}`
            : '';

        const prompt = `
      You are a professional HR assistant helping to craft a thoughtful, empathetic response to employee feedback.
      
      Feedback Title: "${feedbackTitle}"
      Feedback Description: "${feedbackDescription}"
      Category: ${feedbackCategory}${historyContext}
      
      Generate a professional, empathetic reply that:
      1. Acknowledges the employee's concerns
      2. Shows appreciation for their feedback
      3. Provides next steps or timeline if appropriate
      4. Maintains a warm, supportive tone
      5. Is concise (2-4 sentences maximum)
      
      Respond ONLY with a JSON object in the following format:
      {
        "suggestedReply": "Your suggested reply text here",
        "tone": "empathetic" | "professional" | "supportive"
      }
    `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert HR communication assistant. You craft professional, empathetic responses that make employees feel heard and valued. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from Groq API');
        }

        const result = JSON.parse(content);

        return {
            suggestedReply: result.suggestedReply || 'Thank you for sharing your feedback with us. We appreciate your input and will review this carefully.',
            tone: result.tone || 'professional',
        };
    } catch (error) {
        console.error('Error generating reply suggestion with Groq:', error);
        return {
            suggestedReply: 'Thank you for your feedback. We are reviewing your concerns and will follow up with you shortly.',
            tone: 'professional',
        };
    }
}
