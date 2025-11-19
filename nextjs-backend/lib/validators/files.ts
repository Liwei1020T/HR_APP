import { z } from 'zod';

// File upload response
export interface FileResponse {
  id: number;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  entity_type: string | null;
  entity_id: number | null;
  created_at: string;
}

// File with uploader info
export interface FileWithUploaderResponse extends FileResponse {
  uploader: {
    id: number;
    email: string;
    full_name: string;
  };
}

// Attach file to entity request
export const attachFileSchema = z.object({
  entity_type: z.enum(['feedback', 'announcement']),
  entity_id: z.number().int().positive(),
});

export type AttachFileRequest = z.infer<typeof attachFileSchema>;
