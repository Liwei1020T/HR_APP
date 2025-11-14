# HR Web Application

A production-ready HR web application built with React (TypeScript) frontend and Next.js 14 API backend.

## 🎯 Overview

This is a comprehensive HR management system featuring employee feedback, communication channels, real-time chat, announcements, notifications, birthday celebrations, and administrative tools. Built with modern technologies and best practices including role-based access control (RBAC), Prisma ORM for type-safe database access, and PostgreSQL for production-grade data persistence.

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
│   │   └── AdminPage.tsx           # Admin dashboard
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

### Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: Configure via `NEXT_PUBLIC_API_URL` environment variable

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
# Application
APP_NAME=HR Management System
DEBUG=True

# Database
DATABASE_URL=sqlite:///./hr_app.db

# JWT Settings
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MIN=30
JWT_REFRESH_EXPIRE_DAYS=7

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Environment Variables (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:8000
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

**Built with ❤️ using FastAPI and React**
