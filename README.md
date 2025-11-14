# HR Web Application

A production-ready HR web application built as a modular monolith with React (TypeScript) frontend and FastAPI backend.

## 🎯 Overview

This is a comprehensive HR management system featuring employee feedback, communication channels, announcements, notifications, and administrative tools. Built with modern technologies and best practices including role-based access control (RBAC), event-driven architecture, and type-safe API integration.

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

### 💬 Communication Channels & Chat
- Multiple channel types: General, Department, Project, Social
- Public and private channels with join/leave workflow
- In-channel chat feed (polling) for every channel
- HR/Admin members can post **channel announcements** that instantly notify all members
- Messages can be **pinned/unpinned** to highlight important updates
- Member management and channel creation (HR/Admin only)

### 🎉 Birthday Celebrations
- `date_of_birth` tracking on users
- HR/Admin can create monthly birthday events with titles, descriptions, date, and location
- Eligible employees automatically receive invitations and RSVP records
- In-app notifications deep-link invitees directly to the RSVP panel
- RSVP dashboard for admins to review going/pending/not going counts

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

### Backend (FastAPI)
```
backend/
├── app/
│   ├── core/               # Core utilities
│   │   ├── config.py       # Settings and configuration
│   │   ├── dependencies.py # Dependency injection (auth, RBAC)
│   │   └── security.py     # JWT and password utilities
│   ├── db/                 # Database setup
│   │   ├── session.py      # SQLAlchemy session
│   │   └── seed.py         # Database seeding script
│   ├── modules/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── channels/       # Communication channels
│   │   ├── memberships/    # Channel memberships
│   │   ├── feedback/       # Feedback system
│   │   ├── notifications/  # Notifications
│   │   ├── announcements/  # Announcements
│   │   ├── files/          # File management
│   │   └── admin/          # Admin operations
│   ├── utils/              # Utilities
│   │   ├── events.py       # Event bus (pub/sub)
│   │   └── storage.py      # File storage
│   └── main.py             # FastAPI application
├── alembic/                # Database migrations
├── test_*.py               # Test scripts
└── requirements.txt        # Python dependencies
```

**Design Patterns:**
- **Repository-Service-Router Pattern**: Clean separation of concerns
- **Event-Driven Architecture**: In-process pub/sub for notifications
- **Dependency Injection**: FastAPI's built-in DI for auth and database

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
- **Framework**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0.36
- **Migrations**: Alembic 1.14.0
- **Database**: SQLite (dev) / PostgreSQL (production-ready)
- **Authentication**: python-jose (JWT), bcrypt
- **Validation**: Pydantic v2

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
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your settings (defaults work for development)
   ```

5. **Initialize database:**
   ```bash
   # Run migrations
   alembic upgrade head
   
   # Seed database with demo data
   python -m app.db.seed
   ```

6. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   Backend will be available at: **http://localhost:8000**  
   API docs at: **http://localhost:8000/docs**

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

The backend provides comprehensive API documentation via FastAPI's built-in Swagger UI and ReDoc:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

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

Test scripts are provided for each module:

```bash
# Run individual module tests
python test_auth.py
python test_users.py
python test_channels.py
python test_memberships.py
python test_feedback.py
python test_notifications.py
python test_announcements.py
python test_files.py
python test_admin.py

# All tests validate:
# - API endpoint functionality
# - Authentication and authorization
# - Role-based access control
# - Data validation
# - Error handling
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

Backend:
1. Create module directory in `app/modules/your_module/`
2. Add `models.py`, `schemas.py`, `service.py`, `router.py`
3. Register router in `app/main.py`
4. Create migration: `alembic revision --autogenerate -m "add your_module"`
5. Apply migration: `alembic upgrade head`

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
