<div align="center">

# HR Management System

### A Modern, Full-Stack HR Platform Built with Next.js & React

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://hr_app.li-wei.net)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

<p align="center">
  <strong>Streamline HR operations with feedback management, team communication, announcements, and birthday celebrations - all in one platform.</strong>
</p>

[Live Demo](https://hr_app.li-wei.net) | [API Docs](#-api-documentation) | [Quick Start](#-quick-start)

</div>

---

## Live Demo

Try it now: **[https://hr_app.li-wei.net](https://hr_app.li-wei.net)**

**Demo Accounts:**
| Role | Email | Password | What You Can Do |
|------|-------|----------|-----------------|
| SUPERADMIN | sa@demo.local | P@ssw0rd! | Full system access + role management |
| ADMIN | admin@demo.local | P@ssw0rd! | User management + system metrics |
| HR | hr@company.com | password123 | Manage feedback + create announcements |
| EMPLOYEE | user@demo.local | P@ssw0rd! | Submit feedback + join channels + chat |

---

## What Is This?

This is a comprehensive HR management platform that helps organizations:

- **Collect Employee Feedback** - Anonymous or public submissions with AI-powered priority analysis
- **Facilitate Team Communication** - Channels, direct messaging, and announcements
- **Celebrate Milestones** - Automated birthday tracking and event RSVPs
- **Track Performance** - Analytics, audit logs, and vendor management
- **Manage Users** - Role-based access control with 4 permission levels

---

## Feature Showcase

### 1. Employee Feedback System

**Submit and track feedback with full conversation history**

**What Employees Can Do:**
- Submit feedback anonymously or with your name
- Choose categories: GENERAL, COMPLAINT, SUGGESTION, QUESTION, WORKPLACE, MANAGEMENT, BENEFITS, CULTURE
- Attach files (PDFs, images, documents) to support your case
- Track status: SUBMITTED → UNDER_REVIEW → IN_PROGRESS → RESOLVED → CLOSED
- Comment on your feedback to add details
- Get notifications when HR responds or status changes
- View conversation history and resolution timeline

**What HR/Admins Can Do:**
- View all submitted feedback in one dashboard
- Assign feedback to specific team members
- Update status and add internal notes (hidden from employees)
- Use AI to auto-assign priority (URGENT, HIGH, MEDIUM, LOW)
- Generate reports by category, status, department, or date range
- Export analytics for executive review
- Tag feedback as vendor-related for external handling

**AI Features** (when GROQ_API_KEY configured):
- Automatic priority detection from content
- Sentiment analysis and categorization
- Suggested reply generation for HR
- Trend analysis across multiple feedback items

---

### 2. Team Communication Channels

**Real-time messaging and organized team conversations**

**What You Can Do:**
- Join public channels (company-wide, department-specific, project teams)
- Create private channels for sensitive discussions (HR+ only)
- Send real-time messages with instant delivery
- Pin important messages to channel top
- Post channel announcements that notify all members
- View member lists and add/remove people (creator only)
- Search message history
- Share files in conversations
- Direct message colleagues one-on-one

**Channel Types:**
- GENERAL - Company-wide discussions
- DEPARTMENT - Team-specific conversations
- PROJECT - Cross-functional project collaboration
- SOCIAL - Casual employee connections
- ANNOUNCEMENT - Official communications

---

### 3. Company Announcements

**Keep everyone informed about news, policies, and events**

**What Employees Can Do:**
- View all announcements in chronological feed
- Filter by category: COMPANY_NEWS, HR_POLICY, EVENT, BENEFITS, TRAINING
- Pin important announcements for quick access
- Get notifications when new announcements are posted
- Search announcements by keyword

**What HR/Admins Can Do:**
- Create announcements with rich text content
- Attach files (PDFs for policies, images for events)
- Schedule announcements for future publishing
- Set expiration dates for time-sensitive news
- Pin critical announcements to top
- View announcement read statistics
- Edit or delete published announcements

---

### 4. Birthday Celebrations

**Never miss a colleague's birthday**

**How It Works:**
1. Employees add birthday to their profile
2. HR creates monthly birthday events (date, time, location, description)
3. System automatically generates invitations for birthday employees
4. All employees can RSVP (GOING / NOT_GOING / PENDING)
5. Notifications sent X days before event
6. HR can view RSVP counts and attendee lists

**Features:**
- Automatic birthday detection from user profiles
- Create celebration events with custom details
- RSVP tracking and attendance management
- In-app notifications with deep-links
- Birthday calendar view
- Event history and photos

---

### 5. Notifications Center

**Stay updated on everything that matters**

**You'll Get Notified About:**
- New feedback comments or status changes
- Channel messages and @mentions
- New company announcements
- Birthday event invitations
- Assignment of tasks or feedback
- System updates and alerts

**Notification Features:**
- Real-time unread count badge
- Mark individual or all as read
- Clear read notifications
- Delete specific notifications
- Filter by type (FEEDBACK, ANNOUNCEMENT, CHANNEL, SYSTEM)
- Click to navigate directly to related item

---

### 6. Admin Dashboard

**Comprehensive system management and analytics**

**What Admins Can See:**
- **System Metrics**: Total users, active employees, feedback count, channel activity
- **User Management**: View all users with roles, departments, and status
- **Feedback Analytics**: By status, category, priority, and assignment
- **Audit Logs**: Complete activity trail (who did what, when)
- **Birthday Events**: Upcoming celebrations and RSVP stats
- **Vendor Management**: Vendor-related feedback and SLA tracking

**What Admins Can Do:**
- Update user roles (EMPLOYEE, HR, ADMIN, SUPERADMIN)
- Activate/deactivate user accounts
- View and export audit logs
- Generate AI-powered executive reports
- Manage system-wide settings

---

### 7. Vendor Management

**Track external vendor feedback and conversations**

**For Admins:**
- View vendor-specific feedback dashboard
- Tag feedback as vendor-related
- Create threaded conversations with vendors
- Track vendor response times and SLA compliance
- Share files and documents with vendors
- Monitor vendor performance metrics
- Export vendor reports

**For Vendors:**
- Dedicated vendor portal (separate login)
- View assigned feedback
- Respond to inquiries
- Upload attachments
- Track conversation history

---

## Your First 5 Minutes

### As an Employee

**1. Login**
- Visit https://hr_app.li-wei.net
- Use: user@demo.local / P@ssw0rd!

**2. Submit Feedback**
- Click "Feedback" in sidebar
- Click "New Feedback" button
- Fill in:
  - Title: "Suggestion for new coffee machine"
  - Category: WORKPLACE
  - Description: Your detailed feedback
  - Toggle "Anonymous" if desired
- Attach files if needed
- Submit and track progress

**3. Join a Channel**
- Click "Channels" in sidebar
- Browse available public channels
- Click "Join" on "General Discussion"
- Start chatting with your team

**4. Check Announcements**
- Click "Announcements" in sidebar
- Read latest company news
- Pin important ones

**5. RSVP to Birthday Event**
- Click "Celebrations" in sidebar
- View upcoming birthday events
- Click "RSVP" and select your attendance

---

### As HR/Admin

**1. Login as Admin**
- Use: admin@demo.local / P@ssw0rd!

**2. Review Feedback**
- All submitted feedback appears in your queue
- AI suggests priority automatically
- Assign to team members
- Update status and add comments

**3. Create an Announcement**
- Click "Announcements" → "New Announcement"
- Choose category: COMPANY_NEWS
- Write content
- Attach files if needed
- Pin if urgent

**4. Create Birthday Event**
- Click "Admin" → "Birthday Management"
- Create event with date, time, location
- System sends invitations automatically
- View RSVP list

**5. View Analytics**
- Admin Dashboard shows:
  - Total feedback by status
  - User activity metrics
  - Channel engagement
  - System health

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/Liwei1020T/HR_APP.git
cd HR_APP
./deploy.sh
```

Access the app:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/v1
- **Database**: localhost:5433

### Option 2: Manual Setup

```bash
# Backend
cd nextjs-backend
npm install
npx prisma db push
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Core Features

### Authentication & Authorization
- JWT with access/refresh tokens (30-min + 7-day expiry)
- 4-tier role-based access control (EMPLOYEE < HR < ADMIN < SUPERADMIN)
- Secure bcryptjs password hashing (cost 10)
- Self-registration (defaults to EMPLOYEE role)
- Password reset via email

### Feedback Management
- Anonymous or public submission
- 8 categories + custom tags
- Status workflow with 5 stages
- AI-powered priority assignment (optional)
- Threaded comment discussions
- File attachments (10MB max)
- HR assignment and tracking
- Timeline view of all updates
- Vendor feedback routing

### Communication Channels
- Create public or private channels
- Real-time messaging
- Pin critical messages
- Post channel announcements (notify all members)
- Member management (add/remove)
- Direct messaging (1-on-1)
- Message history and search
- File sharing in messages

### Company Announcements
- Category filtering (NEWS, POLICY, EVENT, BENEFITS, TRAINING)
- Pin featured announcements
- Rich text content
- File attachments
- Scheduled publishing
- Expiration dates
- Read statistics

### Birthday Celebrations
- Automatic birthday tracking from profiles
- HR creates monthly events
- Automatic invitation generation
- RSVP system (GOING / NOT_GOING / PENDING)
- Notification reminders
- Attendance tracking
- Event history

### Notifications System
- Real-time unread count
- Type categorization (FEEDBACK, ANNOUNCEMENT, CHANNEL, BIRTHDAY, SYSTEM)
- Mark as read/unread
- Bulk operations (mark all read, clear read)
- Deep-links to related entities
- Delete individual or all

### Admin Dashboard
- System metrics (users, feedback, channels)
- User management (roles, status, departments)
- Audit logs (complete activity trail)
- Feedback analytics
- AI-generated reports (optional)
- Vendor SLA monitoring

### File Management
- Upload to feedback, channels, announcements
- Type validation (PDF, DOC, images)
- Size limits (configurable, default 10MB)
- Secure storage (local or S3/Supabase/Vercel)
- Access control by entity ownership
- Metadata tracking

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Backend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.6
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.22
- **Auth**: JWT + bcryptjs
- **Validation**: Zod 3.23
- **AI**: Groq SDK (optional)
- **Email**: Nodemailer + Resend

</td>
<td valign="top" width="50%">

### Frontend
- **Library**: React 18.2
- **Language**: TypeScript 5.2
- **Build**: Vite 5.4
- **Styling**: Tailwind CSS 3.3
- **State**: TanStack Query 5.8
- **Forms**: React Hook Form 7.48
- **Icons**: Lucide React 0.554
- **Charts**: Recharts 3.5

</td>
</tr>
</table>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Client                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 React + TypeScript                      │  │
│  │  Vite | Tailwind CSS | TanStack Query | React Router   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      API Layer                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Next.js 14 API Routes                      │  │
│  │   JWT Auth | RBAC | Zod Validation | Error Handling    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Data Layer                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Prisma ORM                             │  │
│  │         PostgreSQL | Migrations | Type Safety          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Project Structure

```
HR_APP/
├── frontend/                # React SPA (Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── lib/            # API client, types, utils
│   │   └── pages/          # 18 page components
│   ├── Dockerfile          # Frontend container
│   ├── nginx.conf          # Production server config
│   └── package.json
│
├── nextjs-backend/         # Next.js API-only backend
│   ├── app/api/            # 66+ API endpoints (13 modules)
│   ├── lib/                # Business logic & utilities
│   ├── prisma/             # Database schema (15 tables)
│   ├── Dockerfile          # Backend container
│   ├── Dockerfile.migrate  # Database migration container
│   └── package.json
│
├── docker-compose.yml      # Multi-service orchestration
├── deploy.sh               # One-click deployment script
└── .env.docker.example     # Configuration template
```

---

## Key Highlights

| Feature | Description |
|---------|-------------|
| **One-Click Deploy** | Run `./deploy.sh` - PostgreSQL, backend, frontend all start automatically |
| **66+ API Endpoints** | Complete REST API with comprehensive documentation |
| **4-Tier RBAC** | Granular permissions: EMPLOYEE → HR → ADMIN → SUPERADMIN |
| **Real-Time Chat** | Channel messaging with pins, announcements, and DMs |
| **AI Integration** | Optional Groq AI for priority analysis and report generation |
| **Full Docker Support** | Production-ready containers with multi-stage builds |
| **Type-Safe** | TypeScript across entire stack with Prisma + Zod validation |

---

## Docker Deployment

### One-Click Setup

```bash
git clone https://github.com/Liwei1020T/HR_APP.git
cd HR_APP
./deploy.sh
```

This automatically:
1. Pulls PostgreSQL 16 Alpine image
2. Builds frontend (React + nginx)
3. Builds backend (Next.js standalone)
4. Runs database migrations
5. Starts all services

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | See demo accounts above |
| Backend API | http://localhost:8000/api/v1 | JWT token required |
| Health Check | http://localhost:8000/api/health | Public |
| Database | localhost:5433 | user: hrapp, pass: hrapp123 |

### Commands

```bash
./deploy.sh              # Build + start + migrate
./deploy.sh build        # Build images only
./deploy.sh start        # Start services
./deploy.sh stop         # Stop services
./deploy.sh restart      # Restart services
./deploy.sh seed         # Create demo data (7 users + sample content)
./deploy.sh logs         # View logs (add backend/frontend/postgres)
./deploy.sh status       # Check container status
./deploy.sh clean        # Remove all containers and data
./deploy.sh help         # Show all commands
```

### Configuration

```bash
cp .env.docker.example .env
# Edit .env as needed
```

**Key Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | 8000 | Backend API port |
| `FRONTEND_PORT` | 5173 | Frontend web UI port |
| `DB_PORT` | 5433 | PostgreSQL external port |
| `JWT_SECRET` | (change me!) | JWT signing secret - MUST change in production |
| `GROQ_API_KEY` | (optional) | Enable AI features (get from console.groq.com) |
| `EMAIL_PROVIDER` | console | Options: console, smtp, resend |

---

## API Documentation

**Base URL**:
- Local: `http://localhost:8000/api/v1`
- Production: `https://hr_api.li-wei.net/api/v1`

### Endpoint Modules

| Module | Count | Description |
|--------|-------|-------------|
| `/auth` | 4 | Login, logout, refresh token, get current user |
| `/users` | 5 | Profiles, list, update, search |
| `/channels` | 8 | Create, list, messages, members, join/leave |
| `/direct-conversations` | 4 | 1-on-1 messaging, recipients, read receipts |
| `/feedback` | 10 | Submit, track, comment, assign, status updates |
| `/announcements` | 6 | Create, list, pin, stats, publish/expire |
| `/notifications` | 7 | List, mark read, clear, stats |
| `/files` | 6 | Upload, download, attach, list by entity |
| `/birthday` | 6 | Events, invitations, RSVP, admin management |
| `/admin` | 6 | Users, metrics, audit logs, AI reports |
| `/superadmin` | 2 | Vendor approvals, system settings |
| `/vendor` | 3 | Vendor dashboard, conversations, feedback |
| `/memberships` | 3 | Channel join/leave, my channels |

**Total: 66+ endpoints**

### Quick Examples

**Login:**
```bash
curl -X POST https://hr_api.li-wei.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"P@ssw0rd!"}'
```

**Submit Feedback:**
```bash
curl -X POST https://hr_api.li-wei.net/api/v1/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Coffee machine broken",
    "description": "The coffee machine in the break room needs repair",
    "category": "WORKPLACE",
    "is_anonymous": false
  }'
```

**Get My Feedback:**
```bash
curl https://hr_api.li-wei.net/api/v1/feedback \
  -H "Authorization: Bearer <token>"
```

### Role Permissions

| Role | Feedback | Channels | Announcements | Users | Admin Panel |
|------|----------|----------|---------------|-------|-------------|
| EMPLOYEE | Submit, view own | Join, chat | View | View profile | - |
| HR | + Manage all | + Create | + Create, publish | + View all | - |
| ADMIN | + All actions | + All actions | + All actions | + Manage roles | + Metrics, logs |
| SUPERADMIN | Full control | Full control | Full control | Full control | Full control |

---

## Database Schema

### 15 Database Tables

```prisma
User                      # Authentication, profiles, roles, departments
Channel                   # Team communication spaces (public/private)
ChannelMember             # Channel membership tracking
ChannelMessage            # Real-time chat messages
DirectConversation        # 1-on-1 conversation threads
DirectConversationParticipant  # DM participants
DirectMessage             # Private messages
Feedback                  # Employee submissions with AI analysis
FeedbackComment           # Discussion threads on feedback
FeedbackVendorLog         # Vendor conversation history
Announcement              # Company-wide news and policies
Notification              # User alerts and notifications
File                      # Attachment metadata and storage
AuditLog                  # Complete activity tracking
BirthdayEvent             # Celebration events
BirthdayRegistration      # Event RSVPs
Vendor                    # External vendor management
```

### Database Commands

```bash
npx prisma studio         # Visual DB editor (GUI)
npx prisma db push        # Quick schema sync (dev)
npx prisma migrate dev    # Create migration (production)
npx prisma db seed        # Load demo data
```

---

## Security

### Authentication
- JWT access tokens (30-min expiry, configurable)
- Refresh tokens (7-day expiry)
- bcryptjs password hashing (cost factor 10)
- Automatic token refresh in frontend
- Logout invalidates tokens client-side

### Authorization
- Role-based access control (RBAC) on all endpoints
- Route guards on frontend pages
- Fine-grained permissions per action
- Audit logging of all sensitive operations

### Data Protection
- Prisma ORM prevents SQL injection (parameterized queries)
- React auto-escaping prevents XSS
- Zod schema validation on all inputs
- File upload validation (type, size, extension)
- CORS configured per environment
- Secure HTTP headers (nginx)

### Production Best Practices

**1. Change Default Secrets**
```bash
# Generate strong JWT secret
openssl rand -base64 64
```

**2. Enable HTTPS** (not included - use nginx reverse proxy)

**3. Configure CORS**
```env
CORS_ORIGINS=https://hr_app.li-wei.net
```

**4. Regular Backups**
```bash
# Backup database
docker exec hr-app-db pg_dump -U hrapp hr_app_db > backup.sql
```

---

## AI Features (Optional)

When `GROQ_API_KEY` is configured, the system gains:

### Automatic Feedback Analysis
- Analyzes title + description on submission
- Assigns priority: URGENT, HIGH, MEDIUM, LOW
- Suggests category if unclear
- Detects sentiment and urgency
- Flags vendor-related issues automatically

### AI-Generated Reports
- Summarize feedback trends by time period
- Identify recurring themes and issues
- Generate executive summaries
- Export insights for leadership

### Suggested Replies
- HR can request AI-generated reply suggestions
- Professional, empathetic tone
- Context-aware based on conversation history

### Setup

```bash
# 1. Get API key from https://console.groq.com
# 2. Add to .env
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile  # Or other supported model
```

Without GROQ_API_KEY, system works normally but uses manual priority assignment.

---

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- npm or yarn

### Local Development

```bash
# Backend
cd nextjs-backend
npm install
cp .env.example .env       # Configure DATABASE_URL
npx prisma db push         # Sync database
npm run prisma:seed        # Load demo data
npm run dev                # Start on :8000

# Frontend
cd frontend
npm install
npm run dev                # Start on :5173
```

### Adding a New Feature Module

**1. Database Model** (`prisma/schema.prisma`):
```prisma
model YourFeature {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("your_features")
}
```

**2. Run Migration**:
```bash
npx prisma db push
# Or for production: npx prisma migrate dev --name add_your_feature
```

**3. Create Validator** (`lib/validators/your-feature.ts`):
```typescript
import { z } from 'zod';

export const createYourFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
```

**4. Create API Route** (`app/api/your-feature/route.ts`):
```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createYourFeatureSchema } from '@/lib/validators/your-feature';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  const items = await db.yourFeature.findMany({
    where: { userId: user.id },
  });
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  const body = await request.json();
  const data = createYourFeatureSchema.parse(body);

  const item = await db.yourFeature.create({
    data: { ...data, userId: user.id },
  });
  return Response.json(item, { status: 201 });
}
```

**5. Add Frontend Types** (`frontend/src/lib/types.ts`):
```typescript
export interface YourFeature {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

**6. Create API Client** (`frontend/src/lib/api-client.ts`):
```typescript
export const yourFeatureApi = {
  getAll: () => api.get<YourFeature[]>('/your-feature'),
  create: (data) => api.post<YourFeature>('/your-feature', data),
};
```

**7. Create Page Component** (`frontend/src/pages/YourFeaturePage.tsx`)

**8. Add Route** in `App.tsx` and navigation in `AppLayout.tsx`

---

## Performance

### Response Times
- Authentication: < 100ms
- API endpoints: 50-200ms average
- Database queries: < 50ms (with indexes)
- File uploads: ~1s per 10MB

### Scalability
- Connection pooling (Prisma default: 10)
- Pagination support on all list endpoints
- Database indexes on foreign keys
- Efficient query optimization with Prisma

---

## Security Checklist for Production

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use HTTPS for all traffic
- [ ] Configure strict CORS origins
- [ ] Enable rate limiting (not included - see Contributing)
- [ ] Set up database backups
- [ ] Use environment-specific configs
- [ ] Review audit logs regularly
- [ ] Update dependencies monthly (`npm audit`)

---

## Contributing

Contributions welcome! Areas for improvement:

**High Priority:**
- [ ] WebSocket for real-time updates (currently polling)
- [ ] Email notifications (SMTP configured but not integrated)
- [ ] Rate limiting per user/IP
- [ ] File virus scanning before upload

**Medium Priority:**
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database backup automation
- [ ] Metrics dashboard (Prometheus/Grafana)

**Nice to Have:**
- [ ] Mobile apps (React Native)
- [ ] Desktop app (Electron)
- [ ] SSO integration (OAuth2, SAML)
- [ ] Advanced search (Elasticsearch)

---

## Troubleshooting

### Port Conflicts

If ports 5173, 8000, or 5433 are in use:

```bash
# Edit .env before deploying
FRONTEND_PORT=3000
BACKEND_PORT=8001
DB_PORT=5434
```

### Database Connection Errors

```bash
# Check if PostgreSQL container is running
docker ps | grep hr-app-db

# View database logs
./deploy.sh logs postgres

# Test database connection
docker exec -it hr-app-db psql -U hrapp -d hr_app_db -c "SELECT version();"
```

### Frontend Can't Reach Backend

```bash
# Check backend health
curl http://localhost:8000/api/health

# View backend logs
./deploy.sh logs backend

# Verify CORS_ORIGINS includes frontend URL
docker exec hr-app-backend env | grep CORS
```

---

## License

MIT License - feel free to use this project for learning or as a starting point for your own HR system.

---

<div align="center">

**Built with Next.js 14, React 18, and PostgreSQL**

[Live Demo](https://hr_app.li-wei.net) | [Report Bug](https://github.com/Liwei1020T/HR_APP/issues) | [Request Feature](https://github.com/Liwei1020T/HR_APP/issues)

Made with ❤️ by developers, for HR teams

</div>
