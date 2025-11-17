import { useState } from 'react';
import type { FileUpload } from '../lib/types';

const resolveFileUrl = (path?: string) => {
  if (!path) return '#';
  return path.startsWith('http') ? path : `/${path.replace(/^\/+/, '')}`;
};

const isImageFile = (attachment: FileUpload): boolean => {
  // Check is_image flag first (preferred)
  if (attachment.is_image !== undefined) {
    return attachment.is_image;
  }
  // Fallback to content_type check
  return attachment.content_type?.startsWith('image/') || false;
};

export function AttachmentList({ attachments }: { attachments?: FileUpload[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const images = attachments.filter(isImageFile);
  const files = attachments.filter((a) => !isImageFile(a));

  return (
    <>
      <div className="mt-3 space-y-3">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:border-blue-400"
                onClick={() => setSelectedImage(resolveFileUrl(image.storage_path))}
              >
                <img
                  src={resolveFileUrl(image.storage_path)}
                  alt={image.original_filename}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-xs text-white">{image.original_filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File attachments */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((attachment) => (
              <a
                key={attachment.id}
                href={resolveFileUrl(attachment.storage_path)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <svg
                  className="mr-1.5 h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {attachment.original_filename}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Image modal/lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute right-4 top-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Full size preview"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
