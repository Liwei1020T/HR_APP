import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { generateAdminReport } from '@/lib/ai';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(request, 'HR');
    const body = await request.json();

    const now = new Date();
    const range = body.range || '7d';
    let fromDate: Date;
    let toDate: Date = now;

    if (range === '30d') {
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 30);
    } else if (range === 'custom' && body.from && body.to) {
      fromDate = new Date(body.from);
      toDate = new Date(body.to);
    } else {
      // default 7d
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 7);
    }

    const formatUtc8 = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .format(d)
        .replace(',', '')
        .replace(/\//g, '-'); // e.g., 2025-11-24 14:05

    const where: any = {
      assignedTo: authUser.id,
      createdAt: { gte: fromDate, lte: toDate },
    };

    if (body.status) {
      where.status = body.status;
    }
    if (body.priority) {
      where.priority = body.priority;
    }

    const feedback = await db.feedback.findMany({
      where,
      select: {
        title: true,
        priority: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const total = feedback.length;
    const resolved = feedback.filter((f) => ['RESOLVED', 'CLOSED'].includes(f.status)).length;
    const urgent = feedback.filter((f) => f.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(f.status)).length;
    const openCount = feedback.filter((f) => !['RESOLVED', 'CLOSED'].includes(f.status)).length;

    const avgResponseHours = (() => {
      const closed = feedback.filter((f) => ['RESOLVED', 'CLOSED'].includes(f.status));
      if (!closed.length) return 0;
      const totalHours = closed.reduce((sum, f) => sum + (f.updatedAt.getTime() - f.createdAt.getTime()) / (1000 * 60 * 60), 0);
      return Number((totalHours / closed.length).toFixed(1));
    })();

    const statusBreakdown: Record<string, number> = {};
    feedback.forEach((f) => {
      statusBreakdown[f.status] = (statusBreakdown[f.status] || 0) + 1;
    });

    const highlights = feedback.slice(0, 5).map((f) => ({
      title: f.title,
      priority: f.priority,
      status: f.status,
      category: f.category,
    }));

    const aiResult = await generateAdminReport({
      timeframe: `${formatUtc8(fromDate)} UTC+8 to ${formatUtc8(toDate)} UTC+8`,
      total,
      resolved,
      urgent,
      open: openCount,
      avgResponseHours,
      statusBreakdown,
      recentHighlights: highlights,
    });

    return corsResponse(
      {
        summary: aiResult.summary,
        insights: aiResult.insights,
        stats: {
          total,
          resolved,
          urgent,
          open: openCount,
          avgResponseHours,
          statusBreakdown,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          from_utc8: `${formatUtc8(fromDate)} UTC+8`,
          to_utc8: `${formatUtc8(toDate)} UTC+8`,
        },
      },
      { request, status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
