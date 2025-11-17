import type { FileUpload } from '../lib/types';

const resolveFileUrl = (path?: string) => {
  if (!path) return '#';
  return path.startsWith('http') ? path : `/${path.replace(/^\/+/, '')}`;
};

export function AttachmentList({ attachments }: { attachments?: FileUpload[] }) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={resolveFileUrl(attachment.storage_path)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
        >
          {attachment.original_filename}
        </a>
      ))}
    </div>
  );
}
