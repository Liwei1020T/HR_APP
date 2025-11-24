import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { generateReplySuggestion } from '@/lib/ai';

export async function OPTIONS(request: NextRequest) {
    return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await requireAuth(request);
        requireRole(authUser, ['HR', 'ADMIN', 'SUPERADMIN']);

        const body = await request.json();
        const { feedbackId } = body;

        if (!feedbackId) {
            return corsResponse(
                { error: 'feedbackId is required' },
                { request, status: 400 }
            );
        }

        // Fetch feedback details
        const feedback = await db.feedback.findUnique({
            where: { id: feedbackId },
            include: {
                submitter: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        if (!feedback) {
            return corsResponse(
                { error: 'Feedback not found' },
                { request, status: 404 }
            );
        }

        // Fetch conversation history
        const comments = await db.feedbackComment.findMany({
            where: { feedbackId },
            include: {
                user: {
                    select: {
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: 5, // Last 5 comments for context
        });

        const conversationHistory = comments.map((c) => ({
            author: c.user.fullName,
            message: c.comment,
        }));

        // Generate AI suggestion
        const suggestion = await generateReplySuggestion(
            feedback.title,
            feedback.description,
            feedback.category,
            conversationHistory.length > 0 ? conversationHistory : undefined
        );

        return corsResponse(
            {
                suggestedReply: suggestion.suggestedReply,
                tone: suggestion.tone,
                feedbackTitle: feedback.title,
            },
            { request, status: 200 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
