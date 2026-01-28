<div align="center">

# HR Management System

### A Modern, Full-Stack HR Platform Built with Next.js & React

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://hr-app-frontend-tevw.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

<p align="center">
  <strong>Streamline HR operations with feedback management, team communication, announcements, and birthday celebrations - all in one platform.</strong>
</p>

[Live Demo](https://hr-app-frontend-tevw.onrender.com) | [API Docs](#-api-documentation) | [Quick Start](#-quick-start)

</div>

---

## Screenshots

<table>
  <tr>
    <td><strong>Dashboard</strong></td>
    <td><strong>Feedback System</strong></td>
  </tr>
  <tr>
    <td>Central hub with quick stats and navigation</td>
    <td>Submit and track employee feedback</td>
  </tr>
  <tr>
    <td><strong>Team Channels</strong></td>
    <td><strong>Admin Panel</strong></td>
  </tr>
  <tr>
    <td>Real-time messaging and collaboration</td>
    <td>User management and system metrics</td>
  </tr>
</table>

---

## Highlights

| Feature | Description |
|---------|-------------|
| **One-Click Deploy** | Docker Compose setup - run `./deploy.sh` and you're done |
| **68+ API Endpoints** | Comprehensive REST API with JWT authentication |
| **4-Tier RBAC** | Employee, HR, Admin, Superadmin role hierarchy |
| **Real-Time Chat** | Channel-based messaging with pin/announcement support |
| **AI Integration** | Optional Groq AI for feedback analysis and reporting |
| **Production Ready** | Deployed on Render with PostgreSQL |

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

### Option 2: Manual Setup

```bash
# Backend
cd nextjs-backend
npm install
npx prisma migrate deploy
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Superadmin | sa@demo.local | P@ssw0rd! |
| Admin | admin@demo.local | P@ssw0rd! |
| Employee | user@demo.local | P@ssw0rd! |

---

## Features

### Core Modules

**Authentication & Authorization**
- JWT with access/refresh tokens
- Role-based access control (RBAC)
- Secure bcrypt password hashing
- Self-registration for employees

**Feedback System**
- Anonymous submission option
- Status workflow (submitted → under review → in progress → resolved)
- HR assignment and tracking
- Threaded comments

**Team Communication**
- Public/private channels
- Real-time messaging
- Pin important messages
- Channel announcements

**Company Announcements**
- Category filtering (news, policy, events, benefits)
- Pin featured announcements
- Rich text content

**Birthday Celebrations**
- Automatic birthday tracking
- Event creation with RSVP
- In-app notifications

**Admin Dashboard**
- User management
- System metrics
- Audit logs
- Feedback analytics

**Vendor Management**
- Vendor-specific feedback tracking
- Threaded conversations
- SLA monitoring

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Backend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.22
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **AI**: Groq SDK (optional)

</td>
<td valign="top" width="50%">

### Frontend
- **Library**: React 18
- **Language**: TypeScript 5.6
- **Build**: Vite 5
- **Styling**: Tailwind CSS
- **State**: TanStack Query
- **Forms**: React Hook Form
- **Icons**: Lucide React

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
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── lib/            # API client, types, utils
│   │   └── pages/          # Page components
│   └── package.json
│
├── nextjs-backend/         # Next.js API
│   ├── app/api/            # API routes (13 modules)
│   ├── lib/                # Business logic
│   ├── prisma/             # Database schema & migrations
│   └── package.json
│
├── docker-compose.yml      # Docker orchestration
├── deploy.sh               # One-click deployment
└── .env.docker.example     # Environment template
```

---

## Docker Deployment

### Commands

```bash
./deploy.sh              # Build + start + migrate
./deploy.sh build        # Build images only
./deploy.sh start        # Start services
./deploy.sh stop         # Stop services
./deploy.sh seed         # Create demo data
./deploy.sh logs         # View logs
./deploy.sh status       # Check status
./deploy.sh clean        # Remove everything
```

### Services

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| Frontend (nginx) | 80 | 5173 |
| Backend (Next.js) | 8000 | 8000 |
| PostgreSQL | 5432 | 5433 |

### Configuration

```bash
cp .env.docker.example .env
# Edit .env as needed
```

Key variables:
- `JWT_SECRET` - Change in production!
- `GROQ_API_KEY` - Optional, enables AI features
- `BACKEND_PORT` / `FRONTEND_PORT` - Customize ports

---

## API Documentation

**Base URL**: `http://localhost:8000/api/v1`

### Endpoints Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `/auth` | 4 | Login, logout, refresh, current user |
| `/users` | 4 | User profiles, list, update |
| `/channels` | 8 | Create, list, messages, members |
| `/feedback` | 10 | Submit, track, comment, assign |
| `/announcements` | 6 | Create, list, pin, stats |
| `/notifications` | 7 | List, mark read, clear |
| `/files` | 5 | Upload, download, attach |
| `/birthday` | 6 | Events, invitations, RSVP |
| `/admin` | 6 | Users, metrics, audit logs |

### Authentication

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"P@ssw0rd!"}'

# Use token
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

### Role Permissions

| Role | Feedback | Channels | Announcements | Users | Admin |
|------|----------|----------|---------------|-------|-------|
| Employee | Submit | Join/Chat | View | Profile | - |
| HR | + Manage | + Create | + Create | + View | - |
| Admin | + All | + All | + All | + Manage | + Metrics |
| Superadmin | Full | Full | Full | Full | Full |

---

## Database Schema

### Core Models

```prisma
User           # Authentication, profiles, roles
Channel        # Team communication spaces
ChannelMessage # Real-time messages
Feedback       # Employee submissions
FeedbackComment# Discussion threads
Announcement   # Company-wide news
Notification   # User alerts
File           # Attachments
AuditLog       # Activity tracking
BirthdayEvent  # Celebrations
```

### Commands

```bash
npx prisma studio      # Visual DB editor
npx prisma migrate dev # Create migration
npx prisma db push     # Quick sync (dev)
```

---

## Deployment

### Render.com (Production)

The app is deployed on Render:
- **Frontend**: Static Site
- **Backend**: Web Service
- **Database**: PostgreSQL

### Environment Variables

**Backend**:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-secret>
CORS_ORIGINS=https://your-frontend.com
NODE_ENV=production
```

**Frontend**:
```env
VITE_API_BASE_URL=https://your-backend.com/api/v1
```

---

## Security

- JWT tokens with 30-min expiration
- Refresh token rotation
- bcrypt password hashing (cost 10)
- Role-based API protection
- Zod input validation
- Prisma parameterized queries (SQL injection prevention)
- React XSS protection
- CORS configured per environment

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
cp .env.example .env  # Configure DATABASE_URL
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Adding a New API Module

1. Create Prisma model in `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Add Zod schema in `lib/validators/`
4. Create route in `app/api/your-module/route.ts`
5. Add frontend types in `src/lib/types.ts`
6. Add API client in `src/lib/api-client.ts`

---

## Contributing

Contributions welcome! Areas for improvement:

- [ ] WebSocket real-time updates
- [ ] Email notifications (SMTP integration)
- [ ] File virus scanning
- [ ] Rate limiting
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline

---

## License

MIT License - feel free to use this project for learning or as a starting point for your own HR system.

---

<div align="center">

**Built with Next.js 14, React 18, and PostgreSQL**

[Live Demo](https://hr-app-frontend-tevw.onrender.com) | [Report Bug](https://github.com/Liwei1020T/HR_APP/issues) | [Request Feature](https://github.com/Liwei1020T/HR_APP/issues)

</div>
