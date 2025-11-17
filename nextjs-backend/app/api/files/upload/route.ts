import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scanFile, uploadFile, validateFile } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { handleApiError, createErrorResponse } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    const url = new URL(request.url);
    const entityType = url.searchParams.get('entity_type');
    const entityIdParam = url.searchParams.get('entity_id');
    const entityId = entityIdParam ? parseInt(entityIdParam, 10) : null;

    // Validate and upload file
    validateFile(file);
    const scanResult = await scanFile(file);
    const filePath = await uploadFile(file, 'uploads');

    // Save file metadata
    const fileRecord = await db.file.create({
      data: {
        filename: file.name,
        filePath: filePath,
        fileType: file.type,
        fileSize: file.size,
        originalFilename: file.name,
        scannerStatus: scanResult.status,
        scannerDetails: scanResult.details,
        entityType: entityType,
        entityId,
        uploadedBy: authUser.id,
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
    });

    const response = {
      id: fileRecord.id,
      filename: fileRecord.filename,
      file_path: fileRecord.filePath,
      file_type: fileRecord.fileType,
      file_size: fileRecord.fileSize,
      original_filename: fileRecord.originalFilename,
      scanner_status: fileRecord.scannerStatus,
      scanner_details: fileRecord.scannerDetails,
      uploaded_by: fileRecord.uploadedBy,
      entity_type: fileRecord.entityType,
      entity_id: fileRecord.entityId,
      created_at: formatDate(fileRecord.createdAt),
      uploader: {
        id: fileRecord.uploader.id,
        email: fileRecord.uploader.email,
        full_name: fileRecord.uploader.fullName,
      },
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
