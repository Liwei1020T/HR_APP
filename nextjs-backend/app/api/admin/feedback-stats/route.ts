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
        const authUser = await requireRole(request, 'HR');

        const baseWhere = { assignedTo: authUser.id };
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const prevSevenDaysAgo = new Date();
        prevSevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Total Complaints
        const totalComplaints = await db.feedback.count({ where: baseWhere });

        // 2. Resolution Rate
        const resolvedCount = await db.feedback.count({
            where: {
                ...baseWhere,
                status: { in: ['RESOLVED', 'CLOSED'] },
            },
        });
        const resolutionRate = totalComplaints > 0
            ? Number(((resolvedCount / totalComplaints) * 100).toFixed(1))
            : 0;

        // 3. Urgent Cases
        const urgentCount = await db.feedback.count({
            where: {
                ...baseWhere,
                priority: 'URGENT',
                status: { notIn: ['RESOLVED', 'CLOSED'] },
            },
        });

        // 4. Status Distribution
        const statusGroups = await db.feedback.groupBy({
            by: ['status'],
            where: baseWhere,
            _count: { status: true },
        });
        const statusDistribution = statusGroups.map(g => ({
            name: g.status,
            value: g._count.status,
        }));

        // 5. Trends (Last 7 days)
        const recentFeedback = await db.feedback.findMany({
            where: {
                ...baseWhere,
                createdAt: { gte: sevenDaysAgo },
            },
            select: { createdAt: true, status: true },
        });

        const prevFeedback = await db.feedback.findMany({
            where: {
                ...baseWhere,
                createdAt: { gte: prevSevenDaysAgo, lt: sevenDaysAgo },
            },
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
        const { currentAvgHours, prevAvgHours } = await (async () => {
            const closedItems = await db.feedback.findMany({
                where: {
                    ...baseWhere,
                    status: { in: ['RESOLVED', 'CLOSED'] },
                },
                select: { createdAt: true, updatedAt: true },
            });

            const prevClosed = await db.feedback.findMany({
                where: {
                    ...baseWhere,
                    status: { in: ['RESOLVED', 'CLOSED'] },
                    updatedAt: { gte: prevSevenDaysAgo, lt: sevenDaysAgo },
                },
                select: { createdAt: true, updatedAt: true },
            });

            const avg = (items: typeof closedItems) => {
                if (!items.length) return 0;
                const totalHours = items.reduce((sum, item) => {
                    return sum + (item.updatedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
                }, 0);
                return Number((totalHours / items.length).toFixed(1));
            };

            return { currentAvgHours: avg(closedItems), prevAvgHours: avg(prevClosed) };
        })();

        // Trends vs previous 7 days
        const recentTotal = recentFeedback.length;
        const prevTotal = prevFeedback.length;
        const totalTrend = prevTotal > 0 ? Number((((recentTotal - prevTotal) / prevTotal) * 100).toFixed(1)) : (recentTotal > 0 ? 100 : 0);

        const recentResolved = recentFeedback.filter(f => ['RESOLVED', 'CLOSED'].includes(f.status)).length;
        const prevResolved = prevFeedback.filter(f => ['RESOLVED', 'CLOSED'].includes(f.status)).length;
        const prevResRate = prevTotal > 0 ? prevResolved / prevTotal : 0;
        const recentResRate = totalComplaints > 0 ? resolvedCount / totalComplaints : 0;
        const resolutionRateTrend = prevResRate > 0
            ? Number((((recentResRate - prevResRate) / prevResRate) * 100).toFixed(1))
            : (recentResRate > 0 ? 100 : 0);

        const avgResponseTrend = prevAvgHours > 0
            ? Number((((prevAvgHours - currentAvgHours) / prevAvgHours) * 100).toFixed(1))
            : (currentAvgHours > 0 ? 100 : 0);

        return corsResponse({
            totalComplaints,
            resolutionRate,
            urgentCount,
            avgResponseHours: currentAvgHours,
            totalTrend,
            resolutionRateTrend,
            avgResponseTrend,
            statusDistribution,
            trends,
        }, { request, status: 200 });

    } catch (error) {
        return handleApiError(error);
    }
}
