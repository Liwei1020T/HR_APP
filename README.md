# HR Web Application

A production-ready HR web application built as a modular monolith with React (TypeScript) frontend and a Next.js API backend.

## 🎯 Overview

This is a comprehensive HR management system featuring employee feedback, communication channels, announcements, notifications, birthday celebrations with RSVP, and administrative tools. It preserves the original documentation’s structure while reflecting the current Next.js + Prisma stack.

## 🔑 Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (Employee, HR, Admin, Superadmin)
- Secure password hashing with bcrypt
- Token refresh mechanism with automatic retry
- Employee self-registration (new accounts default to Employee role)

### 📝 Feedback System
- Employee feedback submission with categories (with optional anonymity)
- Status tracking (submitted, under_review, in_progress, resolved, closed)
- HR/Admin assignment and management
- Comments for feedback discussions
- After submission, employees can view admin replies in a dedicated detail view

### 💬 Communication Channels & Chat
- Public/private channels with join/leave workflow and membership management
- Channel detail view with chat feed and message persistence
- HR/Admin can post channel announcements and pin messages
- All channel members receive in-app notifications for announcements

### 🎉 Birthday Celebrations
- User date of birth tracking for eligibility
- Monthly Birthday Events created by HR/Admin (title, description, date, location)
- Auto-generate `BirthdayRegistration` rows for eligible users
- In-app notifications deep-link invitees to the RSVP panel `/birthday/:eventId`
- Admin RSVP dashboard with going/pending/not_going counts and registrant list

### 📢 Announcements
- Company-wide announcements with categories and pinning
- Rich text content, attachments support
- Created by HR/Admin/Superadmin

### 🔔 Notifications
- Event-driven in-app notifications
- Unread counts and mark-as-read/delete
- Polling every 5 seconds for near real-time updates
- Deep links route users back to related modules (feedback, channels, birthdays)

### 📁 File Management
- Upload and download with provider abstraction (local/blob/S3)
- File-attached entities include feedback and announcements

### 👥 Admin Dashboard
- System metrics and analytics
- User management (roles/status)
- Audit logs with event tracking
- Birthday/feedback/announcement summaries

## 🏗️ Architecture

### Backend (Next.js + Prisma)
```
nextjs-backend/
├── app/api/                   # Route handlers
│   ├── auth/                  # /api/v1/auth/* (login, refresh, me)
│   ├── users/                 # /api/v1/users/* (profile, password)
│   ├── channels/              # /api/v1/channels/* (+ messages, members)
│   ├── feedback/              # /api/v1/feedback/* (+ comments)
│   ├── notifications/         # /api/v1/notifications/*
│   ├── announcements/         # /api/v1/announcements/*
│   ├── files/                 # /api/v1/files/*
│   └── birthday/              # /api/v1/birthday/events/* (+ registrations)
├── lib/                       # auth, helpers, logging
├── prisma/                    # schema.prisma, migrations/, seed.ts
├── tests/                     # Vitest unit tests
└── package.json               # scripts (dev/build/prisma/test)
```

Design Patterns:
- Route → Service → Lib layering
- Event-driven notifications (fan-out on important changes)
- Centralized auth helpers (JWT) and request-scoped current user
- Zod validation on requests, consistent error helpers

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/            # AppLayout, widgets
│   ├── contexts/              # AuthContext, notification polling
│   ├── lib/                   # api-client, types
│   ├── pages/                 # Feedback, Channels, ChannelDetail, Birthdays, Profile, Register
│   └── index.css              # Global styles (white inputs/checkboxes)
└── package.json
```

Key Technologies:
- React 18 + Vite
- React Router v6, React Query
- Axios with interceptors, React Hook Form + Zod
- Tailwind utilities (where present)

## 📦 Tech Stack

### Backend
- Next.js 14 App Router
- Prisma ORM, PostgreSQL
- Zod, bcrypt, jsonwebtoken
- Pino logging
- Nodemailer/Resend, AWS SDK/Vercel Blob (as configured)

### Frontend
- React 18 + Vite + TypeScript
- React Router, React Query, Axios
- React Hook Form + Zod, Tailwind utilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd nextjs-backend
npm install
cp .env.example .env           # then edit values
npm run prisma:migrate         # apply dev migrations
npm run prisma:generate        # ensure Prisma client is generated
npm run prisma:seed            # optional demo data
npm run dev                    # starts server on :8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env           # VITE_API_BASE_URL defaults to http://localhost:8000/api/v1
npm run dev                    # starts Vite on :5173
```

## 🔑 Demo Accounts

See `DEMO_CREDENTIALS.md` for demo emails/passwords and roles.

## 📊 API Documentation

This project uses explicit Next.js route handlers under `nextjs-backend/app/api`. Refer to route files and the test scripts (`nextjs-backend/test-*.js`) for usage examples.

### API Endpoints Summary
- Auth: `/api/v1/auth/*`
- Users: `/api/v1/users/*`
- Channels: `/api/v1/channels/*` (+ `/messages`, `/members`)
- Feedback: `/api/v1/feedback/*` (+ `/comments`)
- Notifications: `/api/v1/notifications/*`
- Announcements: `/api/v1/announcements/*`
- Files: `/api/v1/files/*`
- Birthdays: `/api/v1/birthday/events/*` (+ `/registrations`)
- Admin: `/api/v1/admin/*`

## 🗄️ Database Schema

Core tables managed by Prisma migrations (high-level):
- `users` (includes `employee_id`, `date_of_birth`)
- `channels`, `channel_members`, `channel_messages` (+ flags for pinned/announcements)
- `feedback`, `feedback_comments`
- `announcements`
- `files`, `file_attachments`
- `notifications`
- `birthday_events`, `birthday_registrations` (unique: event_id + user_id)
- `audit_logs`

Indexes and constraints are defined in `schema.prisma` and the individual `prisma/migrations/*/migration.sql` files.

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
# Application
APP_NAME=HR Management System
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/hr_app

# JWT Settings
JWT_SECRET=your-super-secret-jwt-key
REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_DAYS=7

# File Storage
FILE_STORAGE_DRIVER=local
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Email (optional)
EMAIL_FROM=hr@example.com
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Frontend Environment Variables (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 🧪 Testing

### Backend Tests
```bash
cd nextjs-backend
npm run test              # Vitest unit tests
npm run test:integration  # Playwright API/E2E tests
npm run lint              # ESLint
```

### Frontend Checks
```bash
cd frontend
npm run lint
npm run type-check
npm run format
```

## 🎨 UI Features

### Responsive Design
- Sidebar navigation (collapsible), responsive grids
- Mobile/desktop optimized layout

### User Experience
- React Query caching and optimistic updates
- Inline validations and toasts for key actions

### Accessibility
- Semantic HTML, keyboard focus states, high-contrast inputs

## 🔒 Security Features

### Authentication
- JWT with access/refresh rotation, bcrypt password hashing

### Authorization
- RBAC checks on API and UI (route guards)

### Data Protection
- Parameterized queries via Prisma ORM
- React XSS protections by default
- Input validation with Zod
- File type/size validation

## 📈 Performance Optimizations

### Backend
- Prisma connection pooling
- Pagination and selective selects
- Indexed columns for common lookups

### Frontend
- Code splitting and lazy routes
- Query caching with sensible stale times
- Debounced inputs where relevant

## 🛠️ Development

### Project Structure Philosophy
- Modular monolith with consistent module boundaries
- Route/Service/Lib separation for clarity
- Type-safe contracts end-to-end

### Adding a New Module
Backend:
1. Create a directory under `app/api/<module>` with `route.ts`
2. Add service/helpers in `lib/` as needed
3. Add Prisma models + migration
4. Add unit tests under `tests/`
5. Register any event notifications in the service layer

Frontend:
1. Add types to `src/lib/types.ts` (or module types)
2. Add API client functions to `src/lib/api-client.ts`
3. Create page component in `src/pages/YourModulePage.tsx`
4. Add route in your router
5. Update navigation in `components/AppLayout.tsx`

### Recent Prisma Migrations
- `20251114090000_add_birthday_events`
- `20251114101500_add_channel_messages_table`
- `20251114113000_channel_message_flags`
- `20251114120000_add_employee_id_to_users`

## 📝 Event System

### Events
- `feedback.created` → notify admins
- `feedback.assigned` → notify assignee
- `feedback.status_changed` → notify submitter
- `announcement.created` → notify audience
- `channel.new_member` → notify channel members
- `channel.announcement` → notify channel members
- `birthday.invite` → invite eligible users

### Subscribers
Event handlers create notifications with metadata that deep-link to the relevant UI (e.g., `birthday_invite` → `/birthday/:eventId`).

## 🚀 Deployment Considerations

### Backend
- Use PostgreSQL in production
- Set strong secrets and HTTPS
- Apply `prisma migrate deploy` on release
- Configure CORS for your domain

### Frontend
- Build with `npm run build` (Vite)
- Host on Vercel/Netlify/S3+CloudFront
- Configure `VITE_API_BASE_URL`

## 🤝 Contributing

For production readiness:
1. Add comprehensive unit/integration tests
2. Set up CI/CD
3. Add monitoring and structured logs
4. Implement rate limiting and audit trails
5. Add optional email notifications

## 💡 Key Learnings

- Modern full-stack patterns with Next.js and React
- Type-safe API integration and RBAC
- Event-driven UX via in-app notifications
- Clean modular structure and migrations with Prisma

## 📞 Support

- See route handlers under `nextjs-backend/app/api`
- Review `MIGRATION.md` for FastAPI → Next.js notes
- Check demo scripts in `nextjs-backend/test-*.js`
- Open issues with reproduction steps when possible

---

Built with ❤️ using Next.js, Prisma, and React

