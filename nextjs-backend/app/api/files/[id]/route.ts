import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFile, deleteFile } from '@/lib/storage';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest } from '@/lib/cors';
import { NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const fileId = parseInt(params.id);

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return handleNotFoundError('File');
    }

    // Access control: only uploader or HR+ can download
    if (file.uploadedBy !== authUser.id && !hasRole(authUser, 'HR')) {
      return handleForbiddenError('Access denied');
    }

    const fileContent = await getFile(file.filePath);

    // If cloud storage, redirect to URL
    if (typeof fileContent === 'string') {
      return NextResponse.redirect(fileContent);
    }

    // Local storage: return file buffer
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': file.fileType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.fileSize.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const fileId = parseInt(params.id);

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return handleNotFoundError('File');
    }

    // Only uploader or ADMIN+ can delete
    if (file.uploadedBy !== authUser.id && !hasRole(authUser, 'ADMIN')) {
      return handleForbiddenError('Insufficient permissions');
    }

    // Delete from storage
    await deleteFile(file.filePath);

    // Delete from database
    await db.file.delete({
      where: { id: fileId },
    });

    const response = NextResponse.json({ message: 'File deleted successfully' }, { status: 200 });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
