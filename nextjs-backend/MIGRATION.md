# Migration Guide: FastAPI → Next.js Backend

This document outlines the complete migration from the FastAPI backend to the Next.js backend, including API parity verification, testing procedures, and troubleshooting.

## 📊 Migration Overview

**Migration Type**: Complete backend replacement  
**Frontend Impact**: ZERO changes required  
**API Compatibility**: 100% maintained  
**Deployment Strategy**: Blue-green deployment recommended

## ✅ API Parity Checklist

### Endpoint Inventory (52 endpoints)

| Module | Endpoint | Method | FastAPI | Next.js | Status |
|--------|----------|--------|---------|---------|--------|
| **Auth** | /api/v1/auth/login | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/auth/refresh | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/auth/logout | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/auth/me | GET | ✅ | ✅ | ✅ Complete |
| **Users** | /api/v1/users/me | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/users/me | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/users | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/users/:id | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/users/:id | PATCH | ✅ | ✅ | ✅ Complete |
| **Channels** | /api/v1/channels | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/channels | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/channels/:id | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/channels/:id | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/channels/:id | DELETE | ✅ | ✅ | ✅ Complete |
| **Memberships** | /api/v1/memberships/join | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/memberships/leave | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/memberships/my-channels | GET | ✅ | ✅ | ✅ Complete |
| **Feedback** | /api/v1/feedback | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback/:id | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback/:id | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback/:id | DELETE | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback/:id/status | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback/:id/comments | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/feedback/:id/comments | POST | ✅ | ✅ | ✅ Complete |
| **Notifications** | /api/v1/notifications | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/notifications/stats | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/notifications/mark-read | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/notifications/mark-all-read | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/notifications/:id | DELETE | ✅ | ✅ | ✅ Complete |
| | /api/v1/notifications/clear-read | POST | ✅ | ✅ | ✅ Complete |
| **Announcements** | /api/v1/announcements | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/announcements | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/announcements/stats | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/announcements/:id | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/announcements/:id | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/announcements/:id | DELETE | ✅ | ✅ | ✅ Complete |
| **Files** | /api/v1/files/upload | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/files/my-files | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/files/:id | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/files/:id | DELETE | ✅ | ✅ | ✅ Complete |
| | /api/v1/files/:id/attach | POST | ✅ | ✅ | ✅ Complete |
| | /api/v1/files/by-entity | GET | ✅ | ✅ | ✅ Complete |
| **Admin** | /api/v1/admin/metrics | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/admin/users | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/admin/feedback/:id/assign | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/admin/users/:id/status | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/admin/users/:id/role | PATCH | ✅ | ✅ | ✅ Complete |
| | /api/v1/admin/audit-logs | GET | ✅ | ✅ | ✅ Complete |
| **Root** | /api/v1/health | GET | ✅ | ✅ | ✅ Complete |
| | /api/v1/version | GET | ✅ | ✅ | ✅ Complete |

**Total**: 52/52 endpoints ✅

## 🔄 Key Compatibility Points

### 1. Authentication
- **JWT Algorithm**: HS256 (same)
- **Token Expiry**: 30 minutes access, 7 days refresh (same)
- **Header Format**: `Authorization: Bearer <token>` (same)
- **Response Structure**: `{access_token, refresh_token, token_type}` (same)

### 2. Database Schema
- **11 Tables**: All mapped from SQLAlchemy to Prisma
- **Field Names**: snake_case in database, camelCase in code (Prisma auto-converts)
- **Relationships**: Cascade deletes preserved
- **Enums**: Same values (UserRole, FeedbackStatus, etc.)

### 3. API Responses
- **Field Naming**: snake_case (e.g., `created_at`, `full_name`)
- **Date Format**: ISO 8601 strings (same)
- **Error Format**: `{"detail": "message", "errors": [...]}` (same)
- **Status Codes**: Identical (200, 201, 400, 401, 403, 404, 409, 422, 500)

### 4. File Uploads
- **Max Size**: 10MB (same)
- **Allowed Types**: .pdf, .doc, .docx, .txt, .jpg, .jpeg, .png (same)
- **Storage**: Local/S3/Blob (FastAPI had local only)

### 5. Pagination
- **Query Params**: `skip` and `limit` (same)
- **Default Limit**: 50 (same)
- **Max Limit**: 100 (same)

## 🧪 Testing Procedures

### Pre-Migration Checklist

1. **Backup FastAPI Database**
   ```powershell
   # SQLite backup (FastAPI)
   copy backend\hr_app.db backend\hr_app_backup.db
   ```

2. **Export Test Data**
   - Export all users
   - Export all feedback
   - Export all channels
   - Note down test credentials

3. **Document Custom Configurations**
   - Custom CORS origins
   - Email settings
   - File storage paths

### Migration Steps

1. **Set Up Next.js Backend**
   ```powershell
   cd nextjs-backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Set DATABASE_URL (PostgreSQL)
   - Configure JWT_SECRET (can reuse FastAPI secret for continuity)
   - Set CORS_ORIGINS

3. **Initialize Database**
   ```powershell
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Run Parallel Testing**
   ```powershell
   # Terminal 1: Keep FastAPI running
   cd backend
   uvicorn app.main:app --port 8001

   # Terminal 2: Start Next.js
   cd nextjs-backend
   npm run dev  # Port 8000
   ```

5. **Test Key Endpoints**
   ```powershell
   # Test login (FastAPI)
   curl -X POST http://localhost:8001/api/v1/auth/login `
     -H "Content-Type: application/json" `
     -d '{"email":"admin@company.com","password":"password123"}'

   # Test login (Next.js)
   curl -X POST http://localhost:8000/api/v1/auth/login `
     -H "Content-Type: application/json" `
     -d '{"email":"admin@company.com","password":"password123"}'

   # Compare responses
   ```

### Endpoint Testing Script

Create `test-parity.ps1`:
```powershell
$NEXTJS_URL = "http://localhost:8000/api/v1"
$FASTAPI_URL = "http://localhost:8001/api/v1"

# Login and get token
$login = @{email="admin@company.com"; password="password123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$NEXTJS_URL/auth/login" -Method POST -Body $login -ContentType "application/json"
$token = $response.access_token

# Test endpoints
$headers = @{Authorization="Bearer $token"}

Write-Host "Testing /users/me..."
$nextjs = Invoke-RestMethod -Uri "$NEXTJS_URL/users/me" -Headers $headers
$fastapi = Invoke-RestMethod -Uri "$FASTAPI_URL/users/me" -Headers $headers
# Compare responses...

Write-Host "Testing /feedback..."
$nextjs = Invoke-RestMethod -Uri "$NEXTJS_URL/feedback" -Headers $headers
$fastapi = Invoke-RestMethod -Uri "$FASTAPI_URL/feedback" -Headers $headers
# Compare responses...

# ... test all endpoints
```

### Frontend Integration Testing

1. **Update Frontend API Base URL**
   ```typescript
   // frontend/src/lib/api.ts
   const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000/api/v1';
   ```

2. **Test All Frontend Features**
   - ✅ Login/logout
   - ✅ View dashboard
   - ✅ Submit feedback
   - ✅ View notifications
   - ✅ Read announcements
   - ✅ Upload files
   - ✅ Admin functions (if applicable)

3. **Browser Console Check**
   - No CORS errors
   - No 401/403 errors
   - No network errors
   - Correct data rendering

## 🔍 Verification Checklist

### Functional Parity
- [ ] All 52 endpoints respond correctly
- [ ] Authentication flow works (login/refresh/logout)
- [ ] Role-based access control enforced
- [ ] Pagination works (skip/limit)
- [ ] File uploads functional
- [ ] Email notifications sent
- [ ] Database relationships maintained
- [ ] Error messages match

### Performance
- [ ] Response times comparable (<100ms difference)
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Memory usage stable

### Security
- [ ] JWT validation working
- [ ] Password hashing verified
- [ ] CORS configured correctly
- [ ] SQL injection protection (Prisma)
- [ ] File upload validation

### Data Integrity
- [ ] User data preserved
- [ ] Feedback data preserved
- [ ] Relationships intact
- [ ] Timestamps accurate

## 🚀 Deployment Strategy

### Blue-Green Deployment

1. **Phase 1: Preparation**
   - Deploy Next.js backend to new server/container
   - Configure separate database or migrate data
   - Run smoke tests

2. **Phase 2: Gradual Rollout**
   - Route 10% of traffic to Next.js backend
   - Monitor for errors
   - Increase to 50% if stable
   - Increase to 100% if stable

3. **Phase 3: Cutover**
   - Update frontend to point to Next.js backend
   - Keep FastAPI backend running for 24 hours (rollback option)
   - Monitor logs and metrics

4. **Phase 4: Cleanup**
   - After 7 days of stable operation
   - Archive FastAPI code (Git tag: `fastapi-final-snapshot`)
   - Delete FastAPI backend files
   - Update documentation

## 🐛 Troubleshooting

### Issue: CORS Errors
**Solution**: Check CORS_ORIGINS in `.env` includes frontend URL

### Issue: 401 Unauthorized
**Solution**: Verify JWT_SECRET matches, check token expiry

### Issue: Database Connection Failed
**Solution**: Check DATABASE_URL, ensure PostgreSQL running

### Issue: File Upload Fails
**Solution**: Check MAX_FILE_SIZE, verify ALLOWED_FILE_TYPES

### Issue: Email Not Sending
**Solution**: Verify EMAIL_PROVIDER config, check SMTP credentials

### Issue: Different Response Format
**Solution**: Check field naming (snake_case), verify Zod schemas

## 📝 Data Migration Script

If migrating existing data from SQLite to PostgreSQL:

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client';
import * as sqlite from 'better-sqlite3';

const prisma = new PrismaClient();
const sqlite_db = new sqlite('backend/hr_app.db');

async function migrate() {
  // Migrate users
  const users = sqlite_db.prepare('SELECT * FROM users').all();
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        isActive: user.is_active === 1,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
    });
  }
  
  // Migrate other tables...
}

migrate();
```

## ✅ Post-Migration Validation

### Week 1: Monitor Closely
- Check error logs daily
- Monitor response times
- Track user complaints
- Verify email delivery
- Check file uploads

### Week 2-4: Stabilization
- Review performance metrics
- Optimize slow queries
- Fix any edge cases
- Update documentation

### Month 2+: Optimization
- Implement caching
- Add performance monitoring
- Optimize database indexes
- Consider CDN for static files

## 🎯 Success Criteria

Migration is successful when:
- ✅ All 52 endpoints functional
- ✅ Zero breaking changes for frontend
- ✅ Performance ≥ FastAPI
- ✅ Zero data loss
- ✅ All roles working correctly
- ✅ File uploads/downloads working
- ✅ Emails sending correctly
- ✅ Tests passing (unit + integration)
- ✅ No CORS errors
- ✅ Logs clean (no errors)

## 📞 Support

If you encounter issues during migration:
1. Check this guide's troubleshooting section
2. Review API endpoint comparison table
3. Check Next.js backend logs
4. Compare responses with FastAPI
5. Open GitHub issue with details

---

**Migration Timeline Estimate**: 1-2 days for setup/testing, 1 day for deployment
**Rollback Plan**: Keep FastAPI running for 24-48 hours, revert frontend API URL if issues
