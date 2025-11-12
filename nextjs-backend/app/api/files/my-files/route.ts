import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate, getPaginationParams } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const files = await db.file.findMany({
      where: { uploadedBy: authUser.id },
      skip,
      take: limit,
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

    return corsResponse(formatted, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
