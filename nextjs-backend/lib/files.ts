import { db } from './db';
import { formatDate } from './utils';

export type AttachmentEntity = 'feedback' | 'announcement' | 'feedback_comment' | 'channel_message';

export interface AttachmentResponse {
  id: number;
  filename: string;
  original_filename: string;
  storage_path: string;
  content_type: string;
  size: number;
  scanner_status: string;
  entity_type: string | null;
  entity_id: number | null;
  uploaded_by: number;
  uploaded_at: string;
}

export async function assignFilesToEntity(opts: {
  attachmentIds: number[];
  userId: number;
  entity: AttachmentEntity;
  entityId: number;
}) {
  const { attachmentIds, userId, entity, entityId } = opts;

  if (!attachmentIds.length) {
    return;
  }

  const files = await db.file.findMany({
    where: {
      id: { in: attachmentIds },
    },
  });

  if (files.length !== attachmentIds.length) {
    throw new Error('One or more attachments not found');
  }

  for (const file of files) {
    if (file.uploadedBy !== userId) {
      throw new Error('Attachment belongs to another user');
    }

    if (file.entityType && file.entityId) {
      throw new Error('Attachment already linked to an entity');
    }

    if (file.scannerStatus !== 'clean') {
      throw new Error('Attachment failed virus scan');
    }
  }

  await db.file.updateMany({
    where: {
      id: { in: attachmentIds },
    },
    data: {
      entityType: entity,
      entityId,
    },
  });
}

export async function getAttachmentsByEntity(
  entity: AttachmentEntity,
  entityIds: number[]
): Promise<Record<number, AttachmentResponse[]>> {
  if (!entityIds.length) {
    return {};
  }

  const files = await db.file.findMany({
    where: {
      entityType: entity,
      entityId: { in: entityIds },
    },
    orderBy: { createdAt: 'asc' },
  });

  return files.reduce<Record<number, AttachmentResponse[]>>((acc, file) => {
    const key = file.entityId ?? -1;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(formatAttachmentResponse(file));
    return acc;
  }, {});
}

export function formatAttachmentResponse(file: {
  id: number;
  filename: string;
  originalFilename: string | null;
  filePath: string;
  fileType: string;
  fileSize: number;
  entityType: string | null;
  entityId: number | null;
  uploadedBy: number;
  createdAt: Date;
  scannerStatus: string;
}): AttachmentResponse {
  return {
    id: file.id,
    filename: file.filename,
    original_filename: file.originalFilename || file.filename,
    storage_path: file.filePath,
    content_type: file.fileType,
    size: file.fileSize,
    scanner_status: file.scannerStatus,
    entity_type: file.entityType,
    entity_id: file.entityId,
    uploaded_by: file.uploadedBy,
    uploaded_at: formatDate(file.createdAt),
  };
}
