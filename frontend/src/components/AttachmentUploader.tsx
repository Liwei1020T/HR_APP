import { useCallback, useMemo, useState } from 'react';
import { filesApi } from '../lib/api-client';
import type { FileUpload } from '../lib/types';

export interface AttachmentState {
  localId: string;
  filename: string;
  previewUrl: string | null;
  metadata?: FileUpload;
  uploading: boolean;
  error?: string;
}

export function useAttachmentUpload(maxFiles: number = 4) {
  const [attachments, setAttachments] = useState<AttachmentState[]>([]);

  const addFiles = useCallback(
    async (fileInput: FileList | File[] | null) => {
      if (!fileInput) return;
      const availableSlots = maxFiles - attachments.length;
      if (availableSlots <= 0) return;
      const filesArray = Array.isArray(fileInput) ? fileInput : Array.from(fileInput);
      const files = filesArray.slice(0, availableSlots);

      for (const file of files) {
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

        setAttachments((prev) => [
          ...prev,
          {
            localId,
            filename: file.name,
            previewUrl,
            uploading: true,
          },
        ]);

        try {
          const metadata = await filesApi.upload(file);
          setAttachments((prev) =>
            prev.map((att) =>
              att.localId === localId
                ? { ...att, metadata, uploading: false, error: undefined }
                : att
            )
          );
        } catch (error: any) {
          setAttachments((prev) =>
            prev.map((att) =>
              att.localId === localId
                ? {
                    ...att,
                    uploading: false,
                    error: error?.response?.data?.detail || 'Upload failed',
                  }
                : att
            )
          );
        }
      }
    },
    [attachments.length, maxFiles]
  );

  const removeAttachment = useCallback((localId: string) => {
    setAttachments((prev) => {
      const target = prev.find((att) => att.localId === localId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((att) => att.localId !== localId);
    });
  }, []);

  const resetAttachments = useCallback(() => {
    attachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const attachmentIds = useMemo(
    () => attachments.map((attachment) => attachment.metadata?.id).filter(Boolean) as number[],
    [attachments]
  );

  const isUploading = useMemo(() => attachments.some((attachment) => attachment.uploading), [attachments]);

  return {
    attachments,
    addFiles,
    removeAttachment,
    resetAttachments,
    attachmentIds,
    isUploading,
  };
}

export function AttachmentPreviewList({
  attachments,
  onRemove,
}: {
  attachments: AttachmentState[];
  onRemove: (localId: string) => void;
}) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.localId}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <div className="flex items-center gap-3">
            {attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.filename}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-white text-sm font-medium text-gray-600">
                📄
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
              {attachment.uploading && (
                <p className="text-xs text-gray-500">Uploading…</p>
              )}
              {attachment.error && (
                <p className="text-xs text-red-600">{attachment.error}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(attachment.localId)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
