import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    await requireAuth(request);
    const entityType = params.type;
    const entityId = parseInt(params.id);

    const files = await db.file.findMany({
      where: {
        entityType: entityType,
        entityId: entityId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = files.map((f) => ({
      id: f.id,
      filename: f.filename,
      file_path: f.filePath,
      file_type: f.fileType,
      file_size: f.fileSize,
      uploaded_by: f.uploadedBy,
      entity_type: f.entityType,
      entity_id: f.entityId,
      created_at: formatDate(f.createdAt),
      uploader: {
        id: f.uploader.id,
        email: f.uploader.email,
        full_name: f.uploader.fullName,
      },
    }));

    const total = files.length;

    return corsResponse({ files: formatted, total }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
