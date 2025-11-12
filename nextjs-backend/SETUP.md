# HR App Backend - Setup Guide

Complete Next.js backend with SQLite database for local development.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults work for development)
```

### 3. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init_sqlite

# Seed demo data
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at: **http://localhost:8000**

---

## 📝 Default Login Credentials

After seeding, you can login with:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `sa@demo.local` | `P@ssw0rd!` | SUPERADMIN | Full system access |
| `admin@demo.local` | `P@ssw0rd!` | ADMIN | Admin dashboard access |
| `user@demo.local` | `P@ssw0rd!` | EMPLOYEE | Standard user access |

**Alternative accounts (from existing seed):**
- `admin@company.com` / `password123` (ADMIN)
- `hr@company.com` / `password123` (HR)
- `john.doe@company.com` / `password123` (EMPLOYEE)

---

## 📦 Package Scripts

```bash
# Development
npm run dev                 # Start dev server on port 8000

# Database
npx prisma generate         # Generate Prisma client
npx prisma migrate dev      # Run migrations
npx prisma db seed         # Seed database with demo data
npx prisma studio          # Open Prisma Studio (DB viewer)
npx prisma migrate reset    # Reset database (⚠️ deletes all data)

# Production
npm run build              # Build for production
npm start                  # Start production server

# Testing
npm test                   # Run tests
npm run test:coverage      # Run tests with coverage
```

---

## 🗄️ Database Schema

### Tables Created:
- **users** - User accounts with roles
- **channels** - Communication channels
- **channel_members** - Channel membership
- **feedback** - Employee feedback submissions
- **feedback_comments** - Comments on feedback
- **notifications** - User notifications
- **announcements** - Company announcements
- **files** - File uploads
- **audit_logs** - System audit trail

### Seeded Demo Data:
- ✅ 3 demo users (Super Admin, Admin, Employee)
- ✅ 7 existing users (various roles)
- ✅ 3 channels (General, HR, Engineering)
- ✅ 9 channel memberships
- ✅ 4 feedback items (various statuses)
- ✅ 2 feedback comments
- ✅ 4 announcements (pinned and regular)
- ✅ 3 notifications
- ✅ 2 audit log entries

---

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile

### Feedback
- `GET /api/v1/feedback` - List feedback
- `POST /api/v1/feedback` - Create feedback
- `GET /api/v1/feedback/:id` - Get feedback details
- `PATCH /api/v1/feedback/:id` - Update feedback
- `POST /api/v1/feedback/:id/comments` - Add comment
- `PATCH /api/v1/feedback/:id/status` - Update status

### Channels
- `GET /api/v1/channels` - List channels
- `POST /api/v1/channels` - Create channel
- `GET /api/v1/channels/:id` - Get channel details
- `PATCH /api/v1/channels/:id` - Update channel
- `DELETE /api/v1/channels/:id` - Delete channel

### Memberships
- `POST /api/v1/memberships/join` - Join channel
- `POST /api/v1/memberships/leave` - Leave channel
- `GET /api/v1/memberships/my-channels` - Get user's channels

### Announcements
- `GET /api/v1/announcements` - List announcements
- `POST /api/v1/announcements` - Create announcement
- `GET /api/v1/announcements/:id` - Get announcement
- `PATCH /api/v1/announcements/:id` - Update announcement
- `DELETE /api/v1/announcements/:id` - Delete announcement
- `GET /api/v1/announcements/stats` - Get stats

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PATCH /api/v1/notifications/mark-read` - Mark as read
- `PATCH /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `GET /api/v1/notifications/stats` - Get stats

### Files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/:id` - Download file
- `GET /api/v1/files/my-files` - List user's files
- `GET /api/v1/files/by-entity` - List files by entity

### Admin
- `GET /api/v1/admin/metrics` - Get dashboard metrics
- `GET /api/v1/admin/users` - List users (admin)
- `PATCH /api/v1/admin/users/:id/role` - Update user role
- `PATCH /api/v1/admin/users/:id/status` - Update user status
- `PATCH /api/v1/admin/feedback/:id/assign` - Assign feedback
- `GET /api/v1/admin/audit-logs` - View audit logs

---

## 🌐 Frontend Integration

Update your frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The frontend at `http://localhost:5173` will automatically connect to the backend.

---

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset everything and start fresh
npx prisma migrate reset
npx prisma db seed
```

### Port Already in Use
```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change port in .env
PORT=8001
```

### Login Fails
1. Check browser console for errors
2. Verify backend is running: `http://localhost:8000/api/v1/health`
3. Check CORS settings in `.env`
4. Clear browser localStorage: `localStorage.clear()`

### CORS Errors
Make sure `.env` has:
```env
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

---

## 📊 View Database

Open Prisma Studio to view/edit data:
```bash
npx prisma studio
```

Opens at: **http://localhost:5555**

---

## 🔐 Security Notes

### Development
- Default JWT secret is weak - only for development
- SQLite database file (`dev.db`) is NOT in git
- `.env` file is NOT in git

### Production
- Change `JWT_SECRET` to a strong random string
- Use PostgreSQL instead of SQLite
- Enable HTTPS
- Set proper CORS origins
- Use environment variables (not .env file)
- Enable rate limiting
- Add proper logging

---

## 📁 Project Structure

```
nextjs-backend/
├── app/
│   └── api/                    # API routes (Next.js App Router)
│       ├── auth/              # Authentication endpoints
│       ├── users/             # User management
│       ├── feedback/          # Feedback system
│       ├── channels/          # Channels/communities
│       ├── memberships/       # Channel memberships
│       ├── notifications/     # Notifications
│       ├── announcements/     # Announcements
│       ├── files/             # File management
│       ├── admin/             # Admin endpoints
│       └── health/            # Health check
├── lib/
│   ├── auth.ts               # Authentication logic
│   ├── db.ts                 # Prisma client
│   ├── errors.ts             # Error handling
│   ├── cors.ts               # CORS handling
│   ├── mail.ts               # Email service
│   ├── storage.ts            # File storage
│   ├── utils.ts              # Utilities
│   └── validators/           # Zod schemas
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Seed script
│   └── migrations/           # Migration history
├── storage/
│   └── uploads/              # Uploaded files (local)
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
└── package.json              # Dependencies & scripts
```

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t hrapp-backend .
docker run -p 8000:8000 --env-file .env hrapp-backend
```

### Manual
```bash
npm run build
npm start
```

---

## 📞 Support

- Check logs in terminal
- Use Prisma Studio to inspect database
- Review API documentation above
- Test endpoints with Postman collection (in `docs/collections/`)

---

**Happy coding! 🎉**
