# Supabase Storage Setup Guide

This guide will help you configure Supabase Storage for file uploads and image previews in your HR Management System.

## 🎯 Overview

Supabase provides S3-compatible object storage that's perfect for storing files and images. This setup enables:
- ✅ File uploads (documents, images, etc.)
- ✅ Image previews in chat and announcements
- ✅ Public URL access for images
- ✅ Secure file management

## 📋 Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Your Supabase project created

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `hr-app` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click **"Create new project"** and wait for setup to complete

## 📦 Step 2: Create Storage Bucket

1. In your Supabase dashboard, navigate to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Configure the bucket:
   - **Name**: `hr-app-files`
   - **Public bucket**: ✅ **Enable** (for image previews)
   - **File size limit**: `10 MB` (adjust as needed)
   - **Allowed MIME types**: Leave empty or specify (e.g., `image/*,application/pdf`)
4. Click **"Create bucket"**

## 🔐 Step 3: Get API Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (secret!)
   ```

⚠️ **Important**: The `service_role` key bypasses Row Level Security. Keep it secret!

## ⚙️ Step 4: Configure Backend Environment

Update your `nextjs-backend/.env` file with your Supabase credentials:

```bash
# Storage Configuration
STORAGE_TYPE="supabase"

# Supabase Storage
SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_BUCKET="hr-app-files"

# File Upload Settings
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
```

### Environment Variables Explained:

- `STORAGE_TYPE`: Set to `"supabase"` to use Supabase Storage
- `SUPABASE_URL`: Your project's API URL
- `SUPABASE_SERVICE_ROLE_KEY`: Secret key for backend operations (⚠️ never expose in frontend!)
- `SUPABASE_BUCKET`: The bucket name you created (`hr-app-files`)
- `MAX_FILE_SIZE`: Maximum file size in bytes (10MB = 10485760)
- `ALLOWED_FILE_TYPES`: Comma-separated list of allowed file extensions

## 🎨 Step 5: Configure Storage Policies (Optional but Recommended)

For better security, you can set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies** in Supabase dashboard
2. Select your `hr-app-files` bucket
3. Add policies:

### Policy: Allow authenticated uploads
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hr-app-files');
```

### Policy: Allow public read access
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hr-app-files');
```

### Policy: Allow users to delete their own files
```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hr-app-files' AND auth.uid() = owner);
```

> **Note**: Since we're using the `service_role` key in the backend, these policies are optional. The backend bypasses RLS.

## 🚀 Step 6: Deploy to Render

Update your Render environment variables:

1. Go to your backend service on [Render Dashboard](https://dashboard.render.com)
2. Navigate to **Environment** tab
3. Add/update the following variables:
   ```
   STORAGE_TYPE=supabase
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_BUCKET=hr-app-files
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy your service

## ✅ Step 7: Test the Configuration

### Test File Upload

1. Log in to your HR app
2. Go to **Channels** or **Feedback**
3. Try uploading an image file
4. Verify the file uploads successfully

### Test Image Preview

1. After uploading an image, it should display as a thumbnail
2. Click the thumbnail to view full-size preview
3. Check that the image loads from Supabase URL (check browser dev tools → Network tab)

### Verify in Supabase Dashboard

1. Go to **Storage** → `hr-app-files` bucket
2. You should see your uploaded files organized in folders:
   - `uploads/` - General uploads
   - Files are named with timestamps (e.g., `1234567890_image.jpg`)

## 🔍 Troubleshooting

### Files not uploading

**Check backend logs:**
```bash
# Local development
cd nextjs-backend
npm run dev

# Production (Render)
# Check logs in Render dashboard
```

**Common issues:**
- ❌ Missing `SUPABASE_SERVICE_ROLE_KEY`
- ❌ Wrong bucket name
- ❌ File size exceeds limit
- ❌ File type not allowed

### Images not displaying

1. **Verify bucket is public**:
   - Go to Storage → hr-app-files → Settings
   - Ensure "Public bucket" is enabled

2. **Check CORS settings**:
   - Images should load from `https://xxxxxxxxxxxxx.supabase.co/storage/v1/object/public/...`
   - If CORS errors, check browser console

3. **Inspect file URL**:
   - Open browser dev tools
   - Check the `storage_path` value in API response
   - Should be a full Supabase URL like: `https://xxxxxxxxxxxxx.supabase.co/storage/v1/object/public/hr-app-files/uploads/1234567890_image.jpg`

### File deletion not working

- Ensure user has permission (uploader or admin)
- Check backend logs for errors
- Verify the file path extraction logic in `deleteFile()` function

## 📊 Storage Limits

### Supabase Free Tier:
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **File uploads**: 50 MB max per file

### Supabase Pro Tier ($25/month):
- **Storage**: 100 GB included
- **Bandwidth**: 250 GB/month included
- **File uploads**: 5 GB max per file

[View Supabase Pricing](https://supabase.com/pricing)

## 🎯 Best Practices

1. **File Size Limits**: Keep `MAX_FILE_SIZE` reasonable to avoid quota issues
2. **File Type Validation**: Always validate file types on backend
3. **Virus Scanning**: Consider integrating antivirus scanning for production
4. **Image Optimization**: Consider resizing images before upload or using Supabase Image Transformations
5. **Backup Strategy**: Supabase automatically backs up your storage, but consider additional backups for critical files
6. **Monitoring**: Monitor storage usage in Supabase dashboard

## 🔄 Switching Storage Providers

You can switch between storage providers by changing `STORAGE_TYPE`:

```bash
# Local filesystem (development only)
STORAGE_TYPE="local"

# Supabase Storage (recommended for production)
STORAGE_TYPE="supabase"

# AWS S3
STORAGE_TYPE="s3"

# Vercel Blob
STORAGE_TYPE="vercel-blob"
```

Each provider requires its own configuration variables. See `nextjs-backend/.env.example` for details.

## 🆘 Support

- **Supabase Documentation**: [docs.supabase.com](https://supabase.com/docs)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Storage Guide**: [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)

## 📝 Summary

You've successfully configured Supabase Storage for your HR Management System! Your app can now:
- ✅ Upload files and images to Supabase
- ✅ Display image previews in chat and announcements
- ✅ Provide direct download links
- ✅ Delete files securely

Next steps:
- Test file uploads in different areas (channels, feedback, announcements)
- Monitor storage usage in Supabase dashboard
- Consider implementing image compression for large uploads
