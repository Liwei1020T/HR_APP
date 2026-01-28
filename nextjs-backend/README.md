# HR App - Next.js Backend

Complete Next.js API-only backend for the HR Management System. Built with Next.js 14 App Router, TypeScript, Prisma ORM, and PostgreSQL.

## 🌐 Live API

**Production**: https://hr_api.li-wei.net/api/v1  
**Health Check**: https://hr_api.li-wei.net/api/v1/health  
**Frontend**: https://hr_app.li-wei.net

## 🚀 Tech Stack

- **Framework**: Next.js 14.2.18 (App Router, API Routes)
- **Language**: TypeScript 5.7.2
- **Database**: PostgreSQL 18.x with Prisma ORM 5.22.0
- **Validation**: Zod 3.23.8
- **Authentication**: JWT (jsonwebtoken 9.0.2 + bcrypt 5.1.1)
- **File Storage**: Local filesystem / AWS S3 / Vercel Blob
- **Email**: Nodemailer 6.9.15 / Resend
- **Testing**: Vitest 2.1.4 + Playwright 1.48.1
- **Deployment**: Render.com (Web Service + PostgreSQL)

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

### Local Development

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ database running locally
- Git for version control

#### 1. Install Dependencies

```bash
cd nextjs-backend
npm install
```

#### 2. Environment Configuration

Create `.env` file in `nextjs-backend` directory:

```env
# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hr_app_db"

# JWT Settings
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MIN="30"
JWT_REFRESH_EXPIRE_DAYS="7"

# CORS - Allow frontend origins
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# File Upload
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
STORAGE_TYPE="local"
STORAGE_PATH="./uploads"

# Email (Optional - defaults to console)
EMAIL_PROVIDER="console"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@hrapp.com"

# App
APP_NAME="HR Management System"
PORT="8000"
```

#### 3. Database Setup

```bash
# Create PostgreSQL database
createdb hr_app_db

# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# (Optional) Seed database with demo data
npm run prisma:seed
```

#### 4. Start Development Server

```bash
npm run dev
```

API available at: `http://localhost:8000/api/v1/*`  
Health check: `http://localhost:8000/api/v1/health`

#### 5. Test the API

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sa@demo.local","password":"P@ssw0rd!"}'
```

## 👥 Demo Accounts

Production system includes these test accounts:

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| sa@demo.local | P@ssw0rd! | SUPERADMIN | Full system access |
| admin@demo.local | P@ssw0rd! | ADMIN | Admin dashboard access |
| user@demo.local | P@ssw0rd! | EMPLOYEE | Standard user |
| hr@company.com | password123 | HR | HR management access |
| john.doe@company.com | password123 | EMPLOYEE | Engineering dept |
| jane.smith@company.com | password123 | EMPLOYEE | Marketing dept |

**Local Development**: Use `npm run prisma:seed` to create additional test users.

## 📚 API Documentation

### Base URLs
- **Local Development**: `http://localhost:8000/api/v1`
- **Production**: `https://hr_api.li-wei.net/api/v1`

### Authentication Flow

1. **Login**: `POST /api/v1/auth/login`
   ```bash
   # Local
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"sa@demo.local","password":"P@ssw0rd!"}'
   
   # Production
   curl -X POST https://hr_api.li-wei.net/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"sa@demo.local","password":"P@ssw0rd!"}'
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

```bash
# Local
curl -X POST http://localhost:8000/api/v1/feedback \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suggestion for improvement",
    "description": "It would be great if we had...",
    "category": "GENERAL",
    "is_anonymous": false
  }'

# Production
curl -X POST https://hr_api.li-wei.net/api/v1/feedback \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suggestion for improvement",
    "description": "It would be great if we had...",
    "category": "GENERAL",
    "is_anonymous": false
  }'
```

### Health Check

```bash
# Local
curl http://localhost:8000/api/v1/health

# Production  
curl https://hr_api.li-wei.net/api/v1/health
```

Returns:
```json
{
  "status": "ok"
}
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

### Common Issues

#### 1. Port Already in Use
**Symptoms**: `Error: listen EADDRINUSE: address already in use :::8000`

**Solutions**:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F
```

#### 2. Database Connection Failed
**Symptoms**: `Can't reach database server at localhost:5432`

**Solutions**:
- Check DATABASE_URL in `.env` file
- Verify PostgreSQL is running: `pg_isready`
- Ensure database exists: `psql -l | grep hr_app_db`
- Test connection: `psql $DATABASE_URL`
- For Docker: Check container is running with `docker ps`

#### 3. Prisma Client Not Generated
**Symptoms**: `@prisma/client did not initialize yet`

**Solutions**:
```bash
# Regenerate Prisma client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

#### 4. Module Not Found / Path Alias Issues
**Symptoms**: `Cannot find module '@/lib/db'`

**Solutions**:
- Verify `tsconfig.json` has `"baseUrl": "."`
- Check `next.config.mjs` webpack aliases
- Rebuild: `npm run build`

- For production, ensure build command includes `npm install` (not `npm ci`)
- Use `npm install --include=dev` to get TypeScript types

#### 5. CORS Errors
**Symptoms**: `No 'Access-Control-Allow-Origin' header is present`

**Solutions**:
- Check `CORS_ORIGINS` environment variable
- Format: No trailing slashes, comma-separated
- Example: `https://hr_app.li-wei.net`
- Restart backend after changing environment variables

**Debug**:
```bash
# Check CORS headers
curl -I -X OPTIONS https://hr_api.li-wei.net/api/v1/auth/login \
  -H "Origin: https://hr_app.li-wei.net"
```

#### 6. Migration Failed
**Symptoms**: `Migration failed to apply cleanly`

**Solutions**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Apply migrations manually
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

#### 7. Authentication Errors
**Symptoms**: `401 Unauthorized` or `Invalid token`

**Solutions**:
- Verify JWT_SECRET is set in environment
- Check token expiration (JWT_EXPIRE_MIN)
- Ensure Authorization header format: `Bearer <token>`
- Test login endpoint:
  ```bash
  curl -X POST https://hr_api.li-wei.net/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"sa@demo.local","password":"P@ssw0rd!"}'
  ```


#### 9. File Upload Errors
**Symptoms**: `413 Payload Too Large` or upload fails

**Solutions**:
- Check MAX_FILE_SIZE environment variable (bytes)
- Verify ALLOWED_FILE_TYPES includes file extension
- Ensure STORAGE_PATH directory exists and is writable
- For production: Use persistent storage or external service (S3)


### Debug Mode

Enable detailed logging:

```env
# .env
DEBUG=true
LOG_LEVEL=debug
```

Check logs:
```bash
# Local
npm run dev | tee debug.log

# Production
# Check application logs
```

### Getting Help

1. Check application logs
2. Run health check: `curl https://hr_api.li-wei.net/api/v1/health`
3. Test database connection in production server shell
4. Review recent commits for breaking changes
5. Compare working local setup vs production config

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository at [github.com/Liwei1020T/HR_APP](https://github.com/Liwei1020T/HR_APP)
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with Next.js 14, Prisma, and PostgreSQL**
**Containerized with Docker**

## 📞 Support

For issues and questions:
- Check `MIGRATION.md` for migration help
- Review API documentation
- Open GitHub issue
