import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { attachFileSchema } from '@/lib/validators/files';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const fileId = parseInt(params.id);
    const body = await request.json();
    const validated = attachFileSchema.parse(body);

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return handleNotFoundError('File');
    }

    // Only uploader can attach
    if (file.uploadedBy !== authUser.id) {
      return handleForbiddenError('Only file uploader can attach');
    }

    // Update file with entity reference
    const updated = await db.file.update({
      where: { id: fileId },
      data: {
        entityType: validated.entity_type,
        entityId: validated.entity_id,
        ...(validated.entity_type === 'feedback' && { feedbackId: validated.entity_id }),
        ...(validated.entity_type === 'announcement' && { announcementId: validated.entity_id }),
      },
    });

    const response = {
      id: updated.id,
      filename: updated.filename,
      file_path: updated.filePath,
      file_type: updated.fileType,
      file_size: updated.fileSize,
      uploaded_by: updated.uploadedBy,
      entity_type: updated.entityType,
      entity_id: updated.entityId,
      created_at: updated.createdAt.toISOString(),
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
