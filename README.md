# HR Web Application

A production-ready HR management system deployed on Render with React (TypeScript) frontend and Next.js 14 API backend.

## 🌐 Live Demo

**Production Deployment:**
- **Frontend**: https://hr-app-frontend-tevw.onrender.com
- **Backend API**: https://hr-app-sofb.onrender.com/api/v1
- **Health Check**: https://hr-app-sofb.onrender.com/api/v1/health

**Demo Accounts:**
| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Superadmin** | sa@demo.local | P@ssw0rd! | Full system access |
| **Admin** | admin@demo.local | P@ssw0rd! | Admin management |
| **Employee** | user@demo.local | P@ssw0rd! | Basic employee access |
| **HR Manager** | hr@company.com | password123 | HR management |

## 🎯 Overview

This is a comprehensive HR management system designed to streamline organizational processes and enhance employee engagement. It features a robust set of tools including employee feedback loops, dynamic communication channels, real-time chat, company-wide announcements, automated birthday celebrations, and powerful administrative controls. Built with modern technologies and deployed on Render's cloud platform with a PostgreSQL database, it offers a secure, scalable, and user-friendly experience for employees, HR managers, and administrators alike.

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC) with 4 roles: Employee, HR, Admin, Superadmin
- Secure password hashing with bcrypt
- Token refresh mechanism with automatic retry
- Employee self-registration (new accounts default to Employee role)

### 📝 Feedback System
- Employee feedback submission with categories
- Anonymous feedback option
- Status tracking (submitted, under_review, in_progress, resolved, closed)
- HR/Admin assignment and management
- Comments system for feedback discussions

### 💬 Communication Channels & Real-Time Chat
- Multiple channel types: General, Department, Project, Social, Announcement
- Public and private channels with join/leave functionality
- **Real-time chat messaging** within every channel
- HR/Admin members can post **channel announcements** that instantly notify all members
- Messages can be **pinned/unpinned** to highlight important updates
- Member management and channel creation (HR/Admin only)
- Message history and member lists

### 🎉 Birthday Celebrations
- `date_of_birth` tracking on user profiles
- HR/Admin can create monthly birthday events with titles, descriptions, date, and location
- Automatic invitation generation for eligible employees
- RSVP system with going/pending/not_going status tracking
- In-app notifications with deep-links to birthday event details
- RSVP dashboard for admins to review attendance counts
- Birthday event management and reporting

### 📢 Announcements
- Company-wide announcements with categories
- Pin important announcements
- Category filtering (company news, HR policy, events, benefits, training)
- Rich text content support
- Created by HR/Admin/Superadmin

### 🔔 Notifications
- Event-driven notification system
- Real-time unread count
- Mark as read/unread
- Bulk operations (mark all as read)
- Type-based categorization (feedback, announcement, channel, system)

### 📁 File Management
- File upload and download
- Attachment to feedback and announcements
- File type validation
- Metadata tracking

### 👥 Admin Dashboard
- System metrics and analytics
- User management (view all users with roles and status)
- Audit logs with event tracking
- Role-based dashboard access

## 📖 Page Guide

### 👤 Authentication & Profile
- **Login (`/login`)**: Secure entry point for employees and admins. Supports demo account quick-login.
- **Register (`/register`)**: Self-registration for new employees.
- **Profile (`/profile`)**: Manage personal information, view role status, and update account settings.

### 🏠 Main Hub
- **Dashboard (`/dashboard`)**: The central hub showing recent activities, quick stats, and navigation shortcuts.

### 💬 Communication
- **Channels (`/channels`)**: Browse and join public channels or access private ones.
- **Channel Chat (`/channels/:id`)**: Real-time messaging interface for team collaboration.
- **Direct Messages (`/messages`)**: Private 1-on-1 conversations with colleagues.
- **Announcements (`/announcements`)**: View company-wide news and updates.

### 📝 Feedback & Support
- **Feedback List (`/feedback`)**: Submit new feedback or browse existing submissions.
- **Feedback Details (`/feedback/:id`)**: Track status, view comments, and engage in discussion on specific feedback items.

### 🎉 Culture & Events
- **Celebrations (`/celebrations`)**: Overview of upcoming birthdays and company events.
- **Event Details (`/celebrations/events/:id`)**: Specifics about an event, including location and time.
- **RSVP (`/celebrations/rsvp`)**: Manage attendance for events.

### 🛡️ Administration
- **Admin Dashboard (`/admin`)**: Comprehensive control panel for user management, system metrics, and audit logs.
- **Birthday Management (`/admin/birthdays`)**: Tools for HR to create and manage birthday events.

## 💡 How to Use

### 1. Logging In
- Use the **Quick Login** buttons on the login page to access different roles (Employee, HR, Admin).
- Or register a new account (defaults to Employee role).

### 2. Submitting Feedback
- Navigate to **Feedback** from the sidebar.
- Click **"Submit Feedback"**.
- Fill in the title, category, and description.
- Toggle "Anonymous" if you wish to stay unidentified.

### 3. Joining the Conversation
- Go to **Channels**.
- Browse "Available Channels" and click **Join** on any public channel.
- Once joined, click the channel card to enter the chat.

### 4. Checking Updates
- Visit **Announcements** to see the latest company news.
- Check the **Notifications** bell icon in the top right for personal alerts.

## 🏗️ Architecture

### Backend (Next.js 14 API Routes)
```
nextjs-backend/
├── app/
│   └── api/                # API Routes (Next.js 14 App Router)
│       ├── admin/          # Admin endpoints
│       │   ├── metrics/
│       │   ├── users/
│       │   ├── audit-logs/
│       │   └── feedback/
│       ├── announcements/  # Announcements endpoints
│       ├── auth/           # Authentication endpoints
│       ├── birthday/       # Birthday celebration endpoints
│       ├── channels/       # Channel management
│       ├── feedback/       # Feedback system
│       ├── files/          # File management
│       ├── memberships/    # Channel memberships
│       ├── notifications/  # Notifications
│       ├── users/          # User management
│       ├── health/         # Health check
│       └── version/        # API version
├── lib/                    # Core utilities
│   ├── auth.ts             # JWT authentication & RBAC
│   ├── cors.ts             # CORS configuration
│   ├── db.ts               # Prisma client singleton
│   ├── errors.ts           # Error handling
│   ├── mail.ts             # Email utilities
│   ├── storage.ts          # File storage
│   ├── utils.ts            # Helper functions
│   └── validators/         # Zod validation schemas
│       ├── admin.ts
│       ├── announcements.ts
│       ├── auth.ts
│       ├── channels.ts
│       ├── feedback.ts
│       ├── files.ts
│       ├── memberships.ts
│       ├── notifications.ts
│       └── users.ts
├── prisma/                 # Database layer
│   ├── schema.prisma       # Prisma schema
│   ├── seed.ts             # Database seeding
│   └── migrations/         # Database migrations
├── storage/                # File uploads
├── .env                    # Environment variables
└── package.json            # Dependencies
```

**Design Patterns:**
- **Next.js API Routes Pattern**: RESTful endpoints using Next.js App Router
- **Prisma ORM**: Type-safe database access with PostgreSQL
- **Zod Validation**: Schema validation for all API inputs
- **JWT Authentication**: Secure token-based auth with role-based access control
- **Repository Pattern**: Clean separation between API routes and database logic

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   ├── AppLayout.tsx   # Main layout with sidebar navigation
│   │   └── ProtectedRoute.tsx # Route guards with RBAC
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state management
│   ├── lib/                # Core libraries
│   │   ├── api.ts          # Axios instance with JWT interceptors
│   │   ├── api-client.ts   # Type-safe API client functions
│   │   ├── queryClient.ts  # TanStack Query configuration
│   │   └── types.ts        # TypeScript type definitions
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx           # Login with demo accounts
│   │   ├── DashboardPage.tsx       # System overview
│   │   ├── FeedbackPage.tsx        # Feedback management
│   │   ├── ChannelsPage.tsx        # Channel management & chat
│   │   ├── AnnouncementsPage.tsx   # Announcements
│   │   ├── NotificationsPage.tsx   # Notifications center
│   │   ├── AdminPage.tsx           # Admin dashboard
│   ├── App.tsx             # Routing configuration
│   ├── main.tsx            # Application entry point
│   └── index.css           # Tailwind CSS styles
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json            # Dependencies
```

**Key Technologies:**
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **React Router v6** for client-side routing with protected routes
- **TanStack React Query** for server state management and caching
- **Axios** for HTTP requests with automatic JWT token injection
- **React Hook Form** with Zod for form validation

## 📦 Tech Stack

### Backend
- **Framework**: Next.js 14.2.18 (App Router with API Routes)
- **Language**: TypeScript 5.7.2
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL 18.x
- **Authentication**: jsonwebtoken 9.0.2, bcrypt 5.1.1
- **Validation**: Zod 3.23.8
- **Email**: Nodemailer 6.9.7

### Frontend
- **UI Library**: React 18.2.0
- **Language**: TypeScript 5.6.3
- **Build Tool**: Vite 5.4.21
- **Styling**: Tailwind CSS 3.4.15
- **State Management**: TanStack React Query 5.8.4
- **HTTP Client**: Axios 1.6.2
- **Routing**: React Router DOM 6.28.0
- **Forms**: React Hook Form 7.48.2
- **Icons**: Lucide React 0.454.0

## 🚀 Getting Started

### Quick Start (Local Development)

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

#### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/Liwei1020T/HR_APP.git
cd HR_APP

# Install backend dependencies
cd nextjs-backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Setup Backend

```bash
cd nextjs-backend

# Create .env file
cat > .env << 'EOF'
# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hr_app_db"

# JWT Settings
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MIN="30"
JWT_REFRESH_EXPIRE_DAYS="7"

# CORS - Allow frontend origin
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# File Upload
MAX_FILE_SIZE="10485760"
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
EOF

# Create PostgreSQL database
createdb hr_app_db

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed demo data (optional)
npm run prisma:seed

# Start backend server
npm run dev
```

Backend runs at: **http://localhost:8000**

#### 3. Setup Frontend

```bash
cd frontend

# Create .env.production
cat > .env.production << 'EOF'
VITE_API_BASE_URL=http://localhost:8000/api/v1
EOF

# Start frontend dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Production Deployment (Render)

The application is deployed on [Render.com](https://render.com) with the following services:

#### Backend Service Configuration

**Service Type**: Web Service  
**Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`  
**Start Command**: `npm run start`  
**Environment Variables**:
```env
DATABASE_URL=<Render PostgreSQL Internal URL>
JWT_SECRET=<strong-random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_DAYS=7
CORS_ORIGINS=https://hr-app-frontend-tevw.onrender.com
NODE_ENV=production
PORT=8000
```

#### Frontend Service Configuration

**Service Type**: Static Site  
**Build Command**: `npm install && npm run build`  
**Publish Directory**: `dist`  
**Environment Variables**:
```env
VITE_API_BASE_URL=https://hr-app-sofb.onrender.com/api/v1
```

#### Database Service

**Service Type**: PostgreSQL  
**Plan**: Free tier (shared CPU, 256MB RAM, 1GB storage)  
**Version**: PostgreSQL 18  
**Connection**: Internal connection from backend service

#### Deployment Steps

1. **Create PostgreSQL Database** on Render
   - Note the internal connection URL

2. **Deploy Backend**
   - Connect GitHub repository
   - Root directory: `nextjs-backend`
   - Set environment variables (including `DATABASE_URL`)
   - Deploy

3. **Deploy Frontend**
   - Connect GitHub repository  
   - Root directory: `frontend`
   - Set `VITE_API_BASE_URL`
   - Deploy

4. **Run Database Setup**
   - Connect to PostgreSQL using external URL
   - Run `database_setup.sql` script manually or let migrations run automatically

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd nextjs-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `nextjs-backend` directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/hr_app_db"

   # JWT Authentication
   JWT_SECRET="your-secret-key-change-in-production"
   JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"

   # Email (Optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="HR App <noreply@hrapp.com>"

   # Frontend URL (for CORS)
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Set up PostgreSQL database:**
   ```bash
   # Install PostgreSQL if not already installed
   # Create database
   createdb hr_app_db
   ```

5. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed database with demo data (optional):**
   ```bash
   npm run seed
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   ```

   Backend will be available at: **http://localhost:8000**  
   API health check: **http://localhost:8000/api/health**

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at: **http://localhost:5173**

## 🔑 Demo Accounts

The seed script creates the following demo accounts for testing:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Employee** | employee@company.com | password123 | Basic access - submit feedback, join channels, view announcements |
| **HR** | hr@company.com | password123 | HR access - manage feedback, create channels/announcements |
| **Admin** | admin@company.com | password123 | Admin access - full management capabilities, view audit logs |
| **Superadmin** | superadmin@company.com | password123 | Full system access - all administrative functions |

**Quick Login:** Use the demo account buttons on the login page for instant access.

## 📊 API Documentation

The backend provides **68+ API endpoints** organized into 13 modules using Next.js App Router:

### Base URLs
- **Local Development**: `http://localhost:8000/api/v1`
- **Production**: `https://hr-app-sofb.onrender.com/api/v1`

### API Modules Overview

#### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/logout` - User logout (invalidates tokens)
- `GET /api/auth/me` - Get current authenticated user info

#### 👥 Users (`/api/users`)
- `GET /api/users` - List all users (paginated, filterable by role)
- `GET /api/users/{id}` - Get user profile by ID
- `PATCH /api/users/{id}` - Update user profile
- `GET /api/users/me` - Get current user's profile

#### 💬 Channels (`/api/channels`)
- `GET /api/channels` - List all channels (public + user's private channels)
- `POST /api/channels` - Create new channel (HR+ only)
- `GET /api/channels/{id}` - Get channel details
- `PATCH /api/channels/{id}` - Update channel (creator only)
- `DELETE /api/channels/{id}` - Delete channel (creator only)
- `GET /api/channels/{id}/members` - List channel members
- `GET /api/channels/{id}/messages` - Get channel messages (paginated)
- `POST /api/channels/{id}/messages` - Post message to channel

#### 🔗 Memberships (`/api/memberships`)
- `POST /api/memberships/join` - Join a channel
- `POST /api/memberships/leave` - Leave a channel
- `GET /api/memberships/my-channels` - Get user's joined channels

#### 📝 Feedback (`/api/feedback`)
- `GET /api/feedback` - List feedback (filtered by status/category)
- `POST /api/feedback` - Submit new feedback
- `GET /api/feedback/{id}` - Get feedback details
- `PATCH /api/feedback/{id}` - Update feedback
- `DELETE /api/feedback/{id}` - Delete feedback (creator only)
- `POST /api/feedback/{id}/comments` - Add comment to feedback
- `GET /api/feedback/{id}/comments` - List feedback comments
- `PATCH /api/feedback/{id}/status` - Update status (HR+ only)
- `POST /api/feedback/{id}/assign` - Assign to HR/Admin (HR+ only)

#### 📢 Announcements (`/api/announcements`)
- `GET /api/announcements` - List all announcements (active + upcoming)
- `POST /api/announcements` - Create announcement (HR+ only)
- `GET /api/announcements/{id}` - Get announcement details
- `PATCH /api/announcements/{id}` - Update announcement (HR+ only)
- `DELETE /api/announcements/{id}` - Delete announcement (HR+ only)
- `GET /api/announcements/stats` - Get announcement statistics

#### 🔔 Notifications (`/api/notifications`)
- `GET /api/notifications` - List user's notifications (paginated)
- `GET /api/notifications/{id}` - Get notification details
- `POST /api/notifications/mark-read` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `POST /api/notifications/clear-read` - Clear read notifications
- `DELETE /api/notifications/delete-all` - Delete all notifications
- `GET /api/notifications/stats` - Get notification statistics

#### 📁 Files (`/api/files`)
- `POST /api/files/upload` - Upload file (supports multiple entities)
- `GET /api/files/{id}` - Download/view file
- `DELETE /api/files/{id}` - Delete file
- `GET /api/files/by-entity` - Get files for specific entity (feedback, channel, etc.)
- `GET /api/files/my-files` - Get user's uploaded files

#### 🎂 Birthdays (`/api/birthday`)
- `GET /api/birthday/events` - List upcoming birthday events
- `POST /api/birthday/events` - Create birthday event (HR+ only)
- `PATCH /api/birthday/events/{id}` - Update event (HR+ only)
- `DELETE /api/birthday/events/{id}` - Delete event (HR+ only)
- `GET /api/birthday/invitations` - Get user's event invitations
- `POST /api/birthday/rsvp` - RSVP to event

#### 👨‍💼 Admin (`/api/admin`)
**Requires ADMIN or SUPERADMIN role**
- `GET /api/admin/users` - Manage all users (paginated)
- `PATCH /api/admin/users/{id}` - Update user (role, status, etc.)
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/feedback` - View all feedback with filters
- `GET /api/admin/metrics` - Get system metrics dashboard
- `GET /api/admin/audit-logs` - View audit logs (all user actions)

#### 🏥 System (`/api/health`, `/api/version`)
- `GET /api/health` - Health check (database connectivity)
- `GET /api/version` - Get API version info

### Authentication
All endpoints (except `/api/auth/login` and `/api/health`) require JWT authentication:
```
Authorization: Bearer <access_token>
```

### Role-Based Access Control (RBAC)
- **EMPLOYEE**: Basic access (submit feedback, join channels, view announcements)
- **HR**: Employee + create channels/announcements, manage feedback
- **ADMIN**: HR + user management, view audit logs, system metrics
- **SUPERADMIN**: Full system access

## 🗄️ Database Schema

### Core Tables

### Database Models (Prisma)

**User**
- Authentication and user management
- Fields: `id`, `email`, `password` (hashed), `fullName`, `role`, `department`, `isActive`, `createdAt`, `updatedAt`
- Roles: `EMPLOYEE`, `HR`, `ADMIN`, `SUPERADMIN`

**Channel**
- Communication channels (public/private)
- Fields: `id`, `name`, `description`, `channelType`, `isPrivate`, `createdById`, `createdAt`, `updatedAt`
- Relations: Creator (User), Members (ChannelMember[]), Messages (ChannelMessage[])

**ChannelMember**
- Channel membership tracking
- Fields: `id`, `channelId`, `userId`, `joinedAt`
- Relations: Channel, User

**ChannelMessage**
- Channel chat messages
- Fields: `id`, `channelId`, `userId`, `content`, `createdAt`, `updatedAt`
- Relations: Channel, User (author)

**Feedback**
- Employee feedback/suggestions
- Fields: `id`, `title`, `description`, `category`, `status`, `priority`, `isAnonymous`, `submittedById`, `assignedToId`, `createdAt`, `updatedAt`
- Relations: Submitter (User), Assignee (User), Comments (FeedbackComment[])

**FeedbackComment**
- Comments on feedback items
- Fields: `id`, `feedbackId`, `userId`, `comment`, `createdAt`
- Relations: Feedback, User (author)

**Notification**
- User notifications
- Fields: `id`, `userId`, `type`, `title`, `message`, `isRead`, `relatedEntity`, `relatedEntityId`, `createdAt`
- Relations: User

**Announcement**
- Company-wide announcements
- Fields: `id`, `title`, `content`, `category`, `priority`, `isPinned`, `createdById`, `publishedAt`, `expiresAt`, `createdAt`, `updatedAt`
- Relations: Creator (User)

**File**
- File upload metadata
- Fields: `id`, `filename`, `filePath`, `fileType`, `fileSize`, `uploadedById`, `entityType`, `entityId`, `createdAt`
- Relations: Uploader (User)

**AuditLog**
- System activity tracking
- Fields: `id`, `userId`, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `createdAt`
- Relations: User

**BirthdayEvent**
- Birthday celebration events
- Fields: `id`, `employeeId`, `eventDate`, `location`, `description`, `createdById`, `createdAt`, `updatedAt`
- Relations: Employee (User), Creator (User), Registrations (BirthdayRegistration[])

**BirthdayRegistration**
- Birthday event RSVPs
- Fields: `id`, `eventId`, `userId`, `attending`, `createdAt`
- Relations: Event (BirthdayEvent), User

### Database Management

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (visual DB editor)
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset
```

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Database - PostgreSQL
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# JWT Settings
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MIN="30"
JWT_REFRESH_EXPIRE_DAYS="7"

# CORS - Comma-separated allowed origins
CORS_ORIGINS="http://localhost:5173,https://hr-app-frontend-tevw.onrender.com"

# File Upload
MAX_FILE_SIZE="10485760"  # 10MB in bytes
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
STORAGE_TYPE="local"
STORAGE_PATH="./uploads"

# Email (Optional - defaults to console logging)
EMAIL_PROVIDER="console"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@hrapp.com"

# App
APP_NAME="HR Management System"
NODE_ENV="production"  # Set to "production" on Render
PORT="8000"
```

### Frontend Environment Variables (.env)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1

# For production (.env.production):
# VITE_API_BASE_URL=https://hr-app-sofb.onrender.com/api/v1
```

## 🧪 Testing

### Backend Tests

```bash
cd nextjs-backend

# Test authentication flow
node test-login.js

# Test demo user login
node test-demo-login.js

# Test user management
node test-users.js

# Run Jest unit tests
npm test

# Run specific test file
npm test auth.test.ts
```

### Manual API Testing

Use the provided Postman collection for comprehensive API testing:
```
nextjs-backend/docs/collections/postman.json
```

Import into Postman or use with Newman CLI for automated testing.

## 🎨 UI Features

### Responsive Design
- Mobile-friendly sidebar (hamburger menu)
- Responsive grid layouts
- Touch-friendly controls
- Optimized for desktop and mobile

### User Experience
- Loading states for async operations
- Error handling with user-friendly messages
- Success feedback for actions
- Optimistic UI updates
- Real-time notification badges

### Accessibility
- Semantic HTML
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors

## 🔒 Security Features

### Authentication
- JWT tokens with expiration
- Refresh token rotation
- Secure password hashing (bcrypt)
- Token stored in memory (not localStorage)

### Authorization
- Role-based access control (RBAC)
- Route guards on frontend
- API endpoint protection
- Fine-grained permissions

### Data Protection
- SQL injection prevention (Prisma ORM parameterized queries)
- XSS protection (React automatic escaping)
- CSRF protection
- Input validation (Zod schemas)
- File type and size validation
- Secure file storage with access control

## 📈 Performance Optimizations

### Backend
- Prisma connection pooling
- Pagination for large datasets
- Efficient database queries with Prisma includes
- Indexed columns for fast lookups
- Next.js API route caching

### Frontend
- Code splitting with React lazy loading
- TanStack Query caching (5-minute stale time)
- Optimistic updates for better UX
- Debounced search inputs
- Memoized components with React.memo

## 🛠️ Development

### Project Architecture
- **Next.js App Router**: File-based routing with API routes
- **Modular Design**: Each API module is self-contained (validators, business logic, routes)
- **Separation of Concerns**: Clear boundaries between API layer, business logic, and data access
- **Type Safety**: Full TypeScript on both frontend and backend with Prisma types
- **Schema Validation**: Zod schemas for runtime type checking

### Adding a New API Module

1. **Create validator schema** in `lib/validators/your_module.ts`:
```typescript
import { z } from 'zod';

export const createYourEntitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
```

2. **Create Prisma model** in `prisma/schema.prisma`:
```prisma
model YourEntity {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

3. **Create API routes** in `app/api/your-module/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, getUserFromToken } from '@/lib/auth';
import { createYourEntitySchema } from '@/lib/validators/your_module';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const entities = await prisma.yourEntity.findMany();
  return NextResponse.json(entities);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const validation = createYourEntitySchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const entity = await prisma.yourEntity.create({
    data: validation.data,
  });

  return NextResponse.json(entity, { status: 201 });
}
```

4. **Run Prisma migration**:
```bash
npx prisma migrate dev --name add_your_entity
```

5. **Add frontend types** in `frontend/src/lib/types.ts`:
```typescript
export interface YourEntity {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

6. **Add API client methods** in `frontend/src/lib/api-client.ts`:
```typescript
export const yourModuleApi = {
  getAll: () => api.get<YourEntity[]>('/your-module'),
  create: (data: CreateYourEntityInput) => api.post<YourEntity>('/your-module', data),
};
```

Frontend:
1. Add types to `src/lib/types.ts`
2. Add API client functions to `src/lib/api-client.ts`
3. Create page component in `src/pages/YourModulePage.tsx`
4. Add route in `src/App.tsx`
5. Add navigation item in `src/components/AppLayout.tsx`

### Recent Prisma Migrations
- `20251114090000_add_birthday_events`
- `20251114101500_add_channel_messages_table`
- `20251114113000_channel_message_flags`
- `20251114120000_add_employee_id_to_users`

## 📝 Event System

The application uses an in-process pub/sub event bus for decoupled communication:

### Events
- `feedback.created` → Notify admins
- `feedback.assigned` → Notify assignee
- `feedback.status_changed` → Notify submitter
- `announcement.created` → Notify all users
- `channel.new_member` → Notify channel members

### Subscribers
All events automatically create notifications for relevant users.

## 🚀 Deployment Considerations

### Production Checklist

#### Backend (Render Web Service)
- ✅ PostgreSQL database created and connected
- ✅ All environment variables configured
- ✅ `DATABASE_URL` uses internal Render connection
- ✅ `CORS_ORIGINS` includes frontend URL (no trailing slash)
- ✅ `NODE_ENV=production` set
- ✅ Strong `JWT_SECRET` generated
- ✅ Build command includes Prisma migration: `npx prisma migrate deploy`
- ✅ Start command: `npm run start -p 8000`

#### Frontend (Render Static Site)
- ✅ `VITE_API_BASE_URL` points to backend `/api/v1` endpoint
- ✅ `.env.production` file committed to repository
- ✅ Build command: `npm install && npm run build`
- ✅ Publish directory: `dist`

#### Database (Render PostgreSQL)
- ✅ Migrations applied automatically via build command
- ✅ Demo data seeded using `database_setup.sql` (if needed)
- ✅ Regular backups enabled
- ✅ Connection pooling configured

### Performance & Security

**Backend:**
- Prisma connection pooling (default 10 connections)
- API route caching with Next.js
- CORS configured for specific origins only
- JWT tokens with 30-minute expiration
- bcrypt password hashing (cost factor 10)
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)

**Frontend:**
- Code splitting with Vite
- TanStack Query caching (5-minute stale time)
- Gzip compression enabled
- Optimized production build
- Environment-specific API URLs

**Database:**
- Indexed columns for fast queries
- Foreign key constraints enforced
- Proper data normalization
- Connection pooling

### Monitoring & Logging

**Render provides:**
- Real-time logs for all services
- Automatic health checks
- Auto-restart on crashes
- Email notifications for failures

**Application logs:**
- Backend: Console logs visible in Render dashboard
- Frontend: Browser console for client-side issues
- Database: Query logs in PostgreSQL service

### Troubleshooting

**Common Issues:**

1. **CORS errors:** Verify `CORS_ORIGINS` matches exact frontend URL
2. **Database connection failed:** Check `DATABASE_URL` uses internal Render URL
3. **Build failures:** Check Node.js version matches requirements (18+)
4. **API 404 errors:** Ensure requests use `/api/v1` prefix
5. **Authentication issues:** Verify `JWT_SECRET` is set and consistent

**Debug Steps:**
```bash
# Check backend health
curl https://hr-app-sofb.onrender.com/api/v1/health

# Test authentication
curl -X POST https://hr-app-sofb.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sa@demo.local","password":"P@ssw0rd!"}'

# View Render logs
# Go to Render Dashboard → Service → Logs tab
```

### Backend
- Use PostgreSQL for production
- Set strong JWT_SECRET
- Enable HTTPS
- Configure CORS for your domain
- Set DEBUG=False
- Use environment-specific settings
- Set up logging and monitoring

### Frontend
- Build for production: `npm run build`
- Serve with nginx or similar
- Configure API URL for production
- Enable gzip compression
- Set up CDN for static assets
- Configure proper cache headers

## 🤝 Contributing

This is a demonstration project. For production use:
1. Add comprehensive unit tests
2. Add integration tests
3. Set up CI/CD pipeline
4. Add proper logging and monitoring
5. Implement rate limiting
6. Add email notifications
7. Add real-time features with WebSockets
8. Implement file virus scanning

## 💡 Key Learnings

This project demonstrates:
- ✅ Modern full-stack development practices
- ✅ Type-safe API integration
- ✅ Role-based access control implementation
- ✅ Event-driven architecture patterns
- ✅ Clean code architecture (modular monolith)
- ✅ Professional UI/UX design
- ✅ Comprehensive error handling
- ✅ Database design and migrations
- ✅ Authentication and authorization flows
- ✅ State management with React Query

## 📞 Support

For issues or questions:
- Check the API documentation at `/docs`
- Review the test scripts for usage examples
- Inspect browser console for frontend errors
- Check backend logs for API errors

---

**Built with ❤️ using Next.js 14, React 18, and PostgreSQL**  
**Deployed on Render Cloud Platform**

**Repository**: [github.com/Liwei1020T/HR_APP](https://github.com/Liwei1020T/HR_APP)
