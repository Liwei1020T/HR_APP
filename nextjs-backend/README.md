# HR App - Next.js Backend

Complete Next.js API-only backend for the HR feedback application. Built with Next.js 14 App Router, TypeScript, Prisma, and PostgreSQL.

## 🚀 Tech Stack

- **Framework**: Next.js 14.2.18 (App Router, Node.js runtime)
- **Language**: TypeScript 5.6.3
- **Database**: PostgreSQL with Prisma ORM 5.22.0
- **Validation**: Zod 3.23.8
- **Authentication**: JWT (jsonwebtoken + bcrypt)
- **File Storage**: Local / AWS S3 / Vercel Blob
- **Email**: Resend / SMTP (Nodemailer)
- **Scheduled Jobs**: Vercel Cron
- **Testing**: Vitest + Playwright
- **Containerization**: Docker

## 📋 Features

### Complete API Coverage (52 Endpoints)

#### Authentication (4 endpoints)
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (client-side)
- `GET /api/auth/me` - Get current user

#### Users (5 endpoints)
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update own profile
- `GET /api/users` - List all users (HR+)
- `GET /api/users/:id` - Get user by ID (HR+)
- `PATCH /api/users/:id` - Update user (ADMIN+)

#### Channels (5 endpoints)
- `GET /api/channels` - List accessible channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel details
- `PATCH /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

#### Memberships (3 endpoints)
- `POST /api/memberships/join` - Join channel
- `POST /api/memberships/leave` - Leave channel
- `GET /api/memberships/my-channels` - List my channels

#### Feedback (8 endpoints)
- `GET /api/feedback` - List feedback (filtered by role)
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/:id` - Get feedback details
- `PATCH /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback
- `PATCH /api/feedback/:id/status` - Update status (HR+)
- `GET /api/feedback/:id/comments` - List comments
- `POST /api/feedback/:id/comments` - Add comment

#### Notifications (6 endpoints)
- `GET /api/notifications` - List notifications
- `GET /api/notifications/stats` - Get notification stats
- `POST /api/notifications/mark-read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/clear-read` - Clear read notifications

#### Announcements (6 endpoints)
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement (HR+)
- `GET /api/announcements/stats` - Get stats (HR+)
- `GET /api/announcements/:id` - Get announcement
- `PATCH /api/announcements/:id` - Update announcement (HR+)
- `DELETE /api/announcements/:id` - Delete announcement (ADMIN+)

#### Files (6 endpoints)
- `POST /api/files/upload` - Upload file
- `GET /api/files/my-files` - List my files
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file
- `POST /api/files/:id/attach` - Attach to entity
- `GET /api/files/by-entity` - List files by entity

#### Admin (6 endpoints)
- `GET /api/admin/metrics` - System metrics (ADMIN+)
- `GET /api/admin/users` - User metrics (ADMIN+)
- `PATCH /api/admin/feedback/:id/assign` - Assign feedback (HR+)
- `PATCH /api/admin/users/:id/status` - Update user status (ADMIN+)
- `PATCH /api/admin/users/:id/role` - Update user role (SUPERADMIN)
- `GET /api/admin/audit-logs` - Audit logs (ADMIN+)

#### Root (2 endpoints)
- `GET /api/health` - Health check
- `GET /api/version` - API version

### Role-Based Access Control
- **EMPLOYEE**: Submit feedback, view own data
- **HR**: Review feedback, manage announcements
- **ADMIN**: User management, system metrics
- **SUPERADMIN**: Full access, role assignment

### Database Schema (11 Tables)
- `users` - User accounts with roles
- `channels` - Communication channels
- `channel_members` - Channel membership
- `feedback` - Employee feedback
- `feedback_comments` - Comments on feedback
- `notifications` - User notifications
- `announcements` - Company announcements
- `files` - File uploads
- `audit_logs` - System audit trail

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ database
- (Optional) Docker for containerized deployment

### 1. Install Dependencies

```powershell
cd nextjs-backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hr_app"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MIN="30"
JWT_REFRESH_EXPIRE_DAYS="7"

# CORS
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# File Upload
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
STORAGE_TYPE="local"

# Email (optional)
EMAIL_PROVIDER="smtp"
FROM_EMAIL="noreply@hr-app.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# App URL (for email links)
APP_URL="http://localhost:5173"
```

### 3. Database Setup

```powershell
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

### 4. Start Development Server

```powershell
npm run dev
```

API will be available at `http://localhost:8000/api/v1/*`

### 5. Test the API

Login with test credentials:
```powershell
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@company.com","password":"password123"}'
```

## 👥 Test Users

After seeding, these users are available:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| superadmin@company.com | password123 | SUPERADMIN | IT |
| admin@company.com | password123 | ADMIN | IT |
| hr@company.com | password123 | HR | Human Resources |
| john.doe@company.com | password123 | EMPLOYEE | Engineering |
| jane.smith@company.com | password123 | EMPLOYEE | Marketing |
| bob.johnson@company.com | password123 | EMPLOYEE | Sales |
| alice.williams@company.com | password123 | EMPLOYEE | Engineering |

## 🐳 Docker Deployment

Build and run with Docker:

```powershell
# Build image
docker build -t hr-app-api .

# Run container
docker run -p 8000:8000 --env-file .env hr-app-api
```

## 📚 API Documentation

### Authentication Flow

1. **Login**: `POST /api/v1/auth/login`
   ```json
   {
     "email": "admin@company.com",
     "password": "password123"
   }
   ```
   Response:
   ```json
   {
     "access_token": "eyJhbGc...",
     "refresh_token": "eyJhbGc...",
     "token_type": "bearer"
   }
   ```

2. **Use Access Token**: Include in Authorization header
   ```
   Authorization: Bearer <access_token>
   ```

3. **Refresh Token**: `POST /api/v1/auth/refresh`
   ```json
   {
     "refresh_token": "eyJhbGc..."
   }
   ```

### Example: Submit Feedback

```powershell
curl -X POST http://localhost:8000/api/v1/feedback `
  -H "Authorization: Bearer <access_token>" `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Suggestion for improvement",
    "description": "It would be great if we had...",
    "category": "GENERAL",
    "is_anonymous": false
  }'
```

## 🧪 Testing

```powershell
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 📦 Project Structure

```
nextjs-backend/
├── app/
│   └── api/              # API route handlers (52 endpoints)
│       ├── auth/
│       ├── users/
│       ├── channels/
│       ├── memberships/
│       ├── feedback/
│       ├── notifications/
│       ├── announcements/
│       ├── files/
│       ├── admin/
│       ├── health/
│       └── version/
├── lib/
│   ├── auth.ts           # JWT & authentication
│   ├── db.ts             # Prisma client
│   ├── errors.ts         # Error handling
│   ├── cors.ts           # CORS utilities
│   ├── mail.ts           # Email service
│   ├── storage.ts        # File storage
│   ├── utils.ts          # Helper functions
│   └── validators/       # Zod schemas
│       ├── auth.ts
│       ├── users.ts
│       ├── channels.ts
│       ├── memberships.ts
│       ├── feedback.ts
│       ├── notifications.ts
│       ├── announcements.ts
│       ├── files.ts
│       └── admin.ts
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
├── uploads/              # Local file storage
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── Dockerfile
└── vercel.json           # Cron jobs
```

## 🔄 Migration from FastAPI

This backend maintains **100% API compatibility** with the original FastAPI backend:
- ✅ Same endpoint paths (`/api/v1/*`)
- ✅ Same request/response JSON structures
- ✅ Same authentication (JWT HS256)
- ✅ Same status codes
- ✅ Same role-based access control

**React frontend requires ZERO changes!**

See `MIGRATION.md` for detailed migration guide.

## 🛠️ Available Scripts

- `npm run dev` - Start development server (port 8000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio

## 🔐 Security Features

- JWT token authentication with refresh tokens
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Request validation with Zod
- CORS configuration
- SQL injection protection (Prisma ORM)
- File upload validation (type + size)

## 📈 Performance

- Connection pooling with Prisma
- Efficient database queries with includes
- Pagination support (skip/limit)
- Indexed database fields
- API route caching (configurable)

## 🚨 Troubleshooting

### Port already in use
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Database connection error
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Verify database exists

### Prisma client not generated
```powershell
npm run prisma:generate
```

### Module not found errors
```powershell
rm -rf node_modules
npm install
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Check `MIGRATION.md` for migration help
- Review API documentation
- Open GitHub issue
