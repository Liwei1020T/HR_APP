# HR Web Application

A production-ready HR web application built with React (TypeScript) frontend and Next.js API Routes backend, powered by PostgreSQL and Prisma ORM.

## 🎯 Overview

This is a comprehensive HR management system featuring employee feedback, communication channels, announcements, notifications, and administrative tools. Built with modern technologies and best practices including role-based access control (RBAC), event-driven architecture, and type-safe API integration.

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC) with 4 roles: Employee, HR, Admin, Superadmin
- Secure password hashing with bcrypt
- Token refresh mechanism with automatic retry

### 📝 Feedback System
- Employee feedback submission with categories
- Anonymous feedback option
- Status tracking (submitted, under_review, in_progress, resolved, closed)
- HR/Admin assignment and management
- Comments system for feedback discussions

### 💬 Communication Channels
- Multiple channel types: General, Department, Project, Social
- Public and private channels
- Join/leave functionality
- Member management
- Channel creation (HR/Admin only)

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

### Backend (Next.js API Routes)
```
nextjs-backend/
├── app/
│   └── api/                # API Routes
│       ├── auth/           # Authentication endpoints
│       ├── users/          # User management
│       ├── channels/       # Communication channels
│       ├── memberships/    # Channel memberships
│       ├── feedback/       # Feedback system
│       ├── notifications/  # Notifications
│       ├── announcements/  # Announcements
│       ├── files/          # File management
│       ├── admin/          # Admin operations
│       └── health/         # Health check endpoint
├── lib/                    # Shared utilities
│   ├── auth.ts             # JWT and auth utilities
│   ├── db.ts               # Prisma client
│   ├── cors.ts             # CORS middleware
│   ├── errors.ts           # Error handling
│   ├── mail.ts             # Email utilities
│   ├── storage.ts          # File storage
│   └── validators/         # Request validation schemas
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeding
│   └── migrations/         # Migration history
├── tests/                  # Test files
└── package.json            # Dependencies
```

**Design Patterns:**
- **API Routes Pattern**: Next.js serverless functions for each endpoint
- **Prisma ORM**: Type-safe database access with auto-generated client
- **Zod Validation**: Runtime type checking and validation

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   ├── AppLayout.tsx   # Main layout with sidebar
│   │   └── ProtectedRoute.tsx # Route guards
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── lib/                # Libraries
│   │   ├── api.ts          # Axios instance with interceptors
│   │   ├── api-client.ts   # Type-safe API client functions
│   │   ├── queryClient.ts  # React Query configuration
│   │   └── types.ts        # TypeScript type definitions
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx   # Login with demo accounts
│   │   ├── DashboardPage.tsx # System overview
│   │   ├── FeedbackPage.tsx # Feedback management
│   │   ├── ChannelsPage.tsx # Channel management
│   │   ├── AnnouncementsPage.tsx # Announcements
│   │   ├── NotificationsPage.tsx # Notifications
│   │   └── AdminPage.tsx   # Admin dashboard
│   ├── App.tsx             # Routing configuration
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
└── package.json            # Node dependencies
```

**Key Technologies:**
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **React Router v6** for routing with guards
- **TanStack React Query** for server state management
- **Axios** for HTTP requests with JWT interceptors

## 📦 Tech Stack

### Backend
- **Framework**: Next.js 14.2.18 (API Routes)
- **Runtime**: Node.js 18+
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL 18
- **Authentication**: jsonwebtoken, bcrypt
- **Validation**: Zod 3.23.8
- **Logging**: Pino 9.4.0

### Frontend
- **UI Library**: React 18.2.0
- **Language**: TypeScript 5.6.3
- **Build Tool**: Vite 5.4.21
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: TanStack React Query 5.8.4
- **HTTP Client**: Axios 1.6.2
- **Routing**: React Router DOM 6.20.0
- **Forms**: React Hook Form 7.48.2

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 18 (or Docker)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd nextjs-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL:**
   - Install PostgreSQL 18 or use Docker
   - Create a database: `CREATE DATABASE hr_app;`

4. **Set up environment variables:**
   ```bash
   # Copy example env file (if exists) or create .env
   # Edit .env with your PostgreSQL connection
   ```
   
   Example `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/hr_app?schema=public"
   JWT_SECRET="your-secret-key"
   JWT_EXPIRE_MIN="30"
   JWT_REFRESH_EXPIRE_DAYS="7"
   CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
   ```

5. **Initialize database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations (creates tables)
   npm run prisma:migrate
   
   # Seed database with demo data
   npm run prisma:seed
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

   Backend will be available at: **http://localhost:8000**  
   API base path: **http://localhost:8000/api/**

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
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env if needed (default points to localhost:8000)
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

The backend provides API endpoints via Next.js API Routes:

- **Base URL**: http://localhost:8000/api/
- **Health Check**: http://localhost:8000/api/health

### API Endpoints Summary

#### Authentication (6 endpoints)
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `PUT /auth/me` - Update profile
- `PUT /auth/me/password` - Change password

#### Users (2 endpoints)
- `GET /users` - List all users (paginated)
- `GET /users/{id}` - Get user by ID

#### Channels (6 endpoints)
- `GET /channels` - List all channels
- `POST /channels` - Create channel (HR+)
- `GET /channels/{id}` - Get channel details
- `PATCH /channels/{id}` - Update channel (creator only)
- `DELETE /channels/{id}` - Delete channel (creator only)
- `GET /channels/{id}/members` - List channel members

#### Memberships (3 endpoints)
- `POST /memberships/join/{channel_id}` - Join channel
- `POST /memberships/leave/{channel_id}` - Leave channel
- `GET /memberships/my-channels` - Get user's channels

#### Feedback (10 endpoints)
- `GET /feedback` - List feedback (filtered)
- `POST /feedback` - Create feedback
- `GET /feedback/{id}` - Get feedback details
- `PATCH /feedback/{id}` - Update feedback
- `DELETE /feedback/{id}` - Delete feedback (creator only)
- `POST /feedback/{id}/assign` - Assign to HR/Admin (HR+)
- `POST /feedback/{id}/status` - Update status (HR+)
- `GET /feedback/{id}/comments` - List comments
- `POST /feedback/{id}/comments` - Add comment
- `DELETE /feedback/comments/{id}` - Delete comment

#### Notifications (6 endpoints)
- `GET /notifications` - List notifications
- `GET /notifications/unread-count` - Get unread count
- `POST /notifications/{id}/read` - Mark as read
- `POST /notifications/{id}/unread` - Mark as unread
- `POST /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/{id}` - Delete notification

#### Announcements (5 endpoints)
- `GET /announcements` - List announcements (filtered)
- `POST /announcements` - Create announcement (HR+)
- `GET /announcements/{id}` - Get announcement details
- `PATCH /announcements/{id}` - Update announcement (creator only)
- `DELETE /announcements/{id}` - Delete announcement (creator only)

#### Files (5 endpoints)
- `POST /files/upload` - Upload file
- `GET /files` - List user's files
- `GET /files/{id}` - Get file metadata
- `GET /files/{id}/download` - Download file
- `DELETE /files/{id}` - Delete file

#### Admin (9 endpoints)
- `GET /admin/metrics` - System metrics (HR+)
- `GET /admin/user-metrics` - User activity metrics (HR+)
- `GET /admin/audit-logs` - Audit logs (Admin+)
- `POST /admin/users/{id}/status` - Update user status (Admin+)
- `POST /admin/users/{id}/role` - Update user role (Superadmin)
- `POST /admin/feedback/{id}/assign` - Assign feedback (HR+)
- `POST /admin/feedback/{id}/status` - Change feedback status (HR+)
- `GET /admin/announcements/scheduled` - Scheduled announcements (HR+)
- `POST /admin/announcements/{id}/publish` - Publish announcement (HR+)

**Total: 52 API endpoints**

## 🗄️ Database Schema

### Core Tables

**users**
- Authentication and user management
- Stores: email, password (hashed), full_name, role, department, is_active

**channels**
- Communication channels
- Stores: name, description, channel_type, is_private, created_by

**channel_members**
- Channel membership tracking
- Links: user_id → users, channel_id → channels

**feedback**
- Employee feedback items
- Stores: title, description, category, status, is_anonymous, submitted_by, assigned_to

**feedback_comments**
- Comments on feedback
- Links: feedback_id → feedback, user_id → users

**notifications**
- User notifications
- Stores: user_id, type, title, message, is_read, related_entity

**announcements**
- Company announcements
- Stores: title, content, category, is_pinned, created_by, published_at

**files**
- File metadata
- Stores: filename, file_path, file_type, file_size, uploaded_by

**audit_logs**
- System activity tracking
- Stores: user_id, action, entity_type, entity_id, details

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/hr_app?schema=public"

# JWT Settings
JWT_SECRET="dev-secret-change-in-production-12345"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MIN="30"
JWT_REFRESH_EXPIRE_DAYS="7"

# CORS
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# File Upload
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
STORAGE_TYPE="local"
STORAGE_PATH="./uploads"

# Email (Console mode for development)
EMAIL_PROVIDER="console"
SMTP_FROM="noreply@hrapp.com"

# App
APP_NAME="HR Management System"
NODE_ENV="development"
PORT="8000"
```

### Frontend Environment Variables (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Tests

Test scripts are provided for quick API validation:

```bash
cd nextjs-backend

# Test authentication
node test-login.js

# Test demo account login
node test-demo-login.js

# Test user endpoints
node test-users.js
```

### Database Management

```bash
# View database in Prisma Studio
npm run prisma:studio

# Create new migration after schema changes
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npm run prisma:reset
```

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
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (React escaping)
- CSRF protection
- Input validation (Pydantic)
- File type validation

## 📈 Performance Optimizations

### Backend
- Connection pooling with SQLAlchemy
- Pagination for large datasets
- Efficient database queries with joins
- Indexed columns for fast lookups

### Frontend
- Code splitting with React lazy loading
- React Query caching (5-minute stale time)
- Optimistic updates for better UX
- Debounced search inputs
- Memoized components

## 🛠️ Development

### Project Structure Philosophy
- **Modular Monolith**: Each module is self-contained but shares infrastructure
- **Separation of Concerns**: Clear boundaries between layers (router, service, repository)
- **Type Safety**: Full TypeScript on frontend, Pydantic on backend
- **Convention over Configuration**: Consistent patterns across modules

### Adding a New Module

Backend (Next.js):
1. Create API route in `app/api/your-module/route.ts`
2. Add validation schema in `lib/validators/your-module.ts`
3. Update Prisma schema if new tables needed: `prisma/schema.prisma`
4. Create migration: `npm run prisma:migrate`
5. Add business logic in route handlers

Frontend:
1. Add types to `src/lib/types.ts`
2. Add API client functions to `src/lib/api-client.ts`
3. Create page component in `src/pages/YourModulePage.tsx`
4. Add route in `src/App.tsx`
5. Add navigation item in `src/components/AppLayout.tsx`

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
- PostgreSQL database (already configured)
- Set strong JWT_SECRET in production
- Enable HTTPS
- Configure CORS for your domain
- Set NODE_ENV=production
- Use environment variables for secrets
- Set up logging and monitoring
- Consider Vercel for easy deployment

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

**Built with ❤️ using Next.js, React, PostgreSQL, and Prisma**
