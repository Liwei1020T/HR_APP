import * as fs from 'fs/promises';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import { put } from '@vercel/blob';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local', 's3', 'vercel-blob', or 'supabase'
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp')
  .split(',')
  .map(type => type.trim());

// S3 client (if using S3)
let s3Client: S3 | null = null;
if (STORAGE_TYPE === 's3' && process.env.AWS_S3_BUCKET) {
  s3Client = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  });
}

// Supabase client (if using Supabase)
let supabaseClient: SupabaseClient | null = null;
if (STORAGE_TYPE === 'supabase' && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Ensure upload directory exists (for local storage)
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): void {
  const ext = path.extname(file.name).toLowerCase();
  
  if (!ALLOWED_FILE_TYPES.includes(ext)) {
    throw new Error(`File type ${ext} not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${file.size} exceeds maximum ${MAX_FILE_SIZE} bytes`);
  }
}

/**
 * Upload file to storage
 * Returns the file path/URL
 */
export async function uploadFile(file: File, folder: string = 'general'): Promise<string> {
  validateFile(file);

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${sanitizedName}`;

  if (STORAGE_TYPE === 'local') {
    await ensureUploadDir();
    const folderPath = path.join(UPLOAD_DIR, folder);
    await fs.mkdir(folderPath, { recursive: true });
    
    const filePath = path.join(folderPath, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    
    return `uploads/${folder}/${filename}`;
  }

  if (STORAGE_TYPE === 's3' && s3Client && process.env.AWS_S3_BUCKET) {
    const key = `${folder}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await s3Client.putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }).promise();
    
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
  }

  if (STORAGE_TYPE === 'vercel-blob') {
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(`${folder}/${filename}`, buffer, {
      access: 'public',
      contentType: file.type,
    });
    
    return blob.url;
  }

  if (STORAGE_TYPE === 'supabase' && supabaseClient && process.env.SUPABASE_BUCKET) {
    const key = `${folder}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const { data, error } = await supabaseClient.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(key, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseClient.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(key);

    return urlData.publicUrl;
  }

  throw new Error('Invalid storage type configured');
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (STORAGE_TYPE === 'local') {
    const fullPath = path.join(process.cwd(), filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  if (STORAGE_TYPE === 's3' && s3Client && process.env.AWS_S3_BUCKET) {
    const key = filePath.replace(`https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/`, '');
    try {
      await s3Client.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      }).promise();
    } catch (error) {
      console.error('Failed to delete S3 file:', error);
    }
  }

  if (STORAGE_TYPE === 'supabase' && supabaseClient && process.env.SUPABASE_BUCKET) {
    try {
      // Extract the path from the public URL
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/');
      // Path structure: /storage/v1/object/public/{bucket}/{path}
      const bucketIndex = pathParts.indexOf('public') + 1;
      const key = pathParts.slice(bucketIndex + 1).join('/');
      
      const { error } = await supabaseClient.storage
        .from(process.env.SUPABASE_BUCKET)
        .remove([key]);

      if (error) {
        console.error('Failed to delete Supabase file:', error);
      }
    } catch (error) {
      console.error('Failed to parse Supabase file path:', error);
    }
  }

  // Vercel Blob doesn't support programmatic deletion via SDK in this version
  // Files expire based on plan settings
}

/**
 * Get file from storage (for download)
 * Returns buffer for local storage, URL for cloud storage
 */
export async function getFile(filePath: string): Promise<Buffer | string> {
  if (STORAGE_TYPE === 'local') {
    const fullPath = path.join(process.cwd(), filePath);
    return await fs.readFile(fullPath);
  }

  // For S3, Vercel Blob, and Supabase, return the URL directly
  // The client can download from the URL or display it directly for images
  return filePath;
}

/**
 * Check if a file is an image based on content type
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/');
}

/**
 * Stub scanner for demonstration; replace with real virus scanning integration as needed.
 */
export async function scanFile(
  file: File
): Promise<{ status: 'clean' | 'infected'; details?: string }> {
  // Placeholder logic: always report clean in this demo.
  return { status: 'clean', details: 'No threats detected (stub scanner)' };
}
