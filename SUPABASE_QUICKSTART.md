# 🎨 Supabase Storage Quick Setup

## 1️⃣ Create Supabase Account & Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Choose region and set password

## 2️⃣ Create Storage Bucket
- Navigate to **Storage** in dashboard
- Click **"Create a new bucket"**
- Name: `hr-app-files`
- ✅ Enable **"Public bucket"**
- Set file size limit: `10 MB`

## 3️⃣ Get API Keys
Go to **Settings → API** and copy:
- `Project URL`
- `service_role` key (keep secret!)

## 4️⃣ Configure Backend (.env)
```bash
STORAGE_TYPE="supabase"
SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_BUCKET="hr-app-files"
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
```

## 5️⃣ Update Render Environment
Add the same variables to your Render backend service environment.

## 6️⃣ Test
- Upload an image in Channels or Feedback
- Verify image preview appears
- Click to view full-size

## ✅ Done!
Your app now stores files in Supabase and displays image previews! 🎉

---

📖 For detailed instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
