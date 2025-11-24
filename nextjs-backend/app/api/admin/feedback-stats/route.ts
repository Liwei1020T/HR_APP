import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
    return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);
        await requireRole(request, 'HR');

        // 1. Total Complaints
        const totalComplaints = await db.feedback.count();

        // 2. Resolution Rate
        const resolvedCount = await db.feedback.count({
            where: { status: { in: ['RESOLVED', 'CLOSED'] } },
        });
        const resolutionRate = totalComplaints > 0
            ? ((resolvedCount / totalComplaints) * 100).toFixed(1)
            : '0.0';

        // 3. Urgent Cases
        const urgentCount = await db.feedback.count({
            where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED'] } },
        });

        // 4. Status Distribution
        const statusGroups = await db.feedback.groupBy({
            by: ['status'],
            _count: { status: true },
        });
        const statusDistribution = statusGroups.map(g => ({
            name: g.status,
            value: g._count.status,
        }));

        // 5. Trends (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentFeedback = await db.feedback.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true, status: true },
        });

        // Group by date
        const trendsMap = new Map<string, { complaints: number; resolved: number }>();

        // Initialize last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            trendsMap.set(dateStr, { complaints: 0, resolved: 0 });
        }

        recentFeedback.forEach(f => {
            const dateStr = f.createdAt.toISOString().split('T')[0];
            if (trendsMap.has(dateStr)) {
                const entry = trendsMap.get(dateStr)!;
                entry.complaints++;
                if (['RESOLVED', 'CLOSED'].includes(f.status)) {
                    entry.resolved++;
                }
            }
        });

        const trends = Array.from(trendsMap.entries())
            .map(([date, stats]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                complaints: stats.complaints,
                resolved: stats.resolved,
            }))
            .reverse();

        // Mock data for Avg Response Time & SLA (requires more complex DB tracking)
        const avgResponseTime = '38.3h';
        const slaCompliance = '25.0%';

        return corsResponse({
            totalComplaints,
            resolutionRate,
            urgentCount,
            avgResponseTime,
            slaCompliance,
            statusDistribution,
            trends,
        }, { request, status: 200 });

    } catch (error) {
        return handleApiError(error);
    }
}
