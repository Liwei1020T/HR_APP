# HR Portal - Frontend

React + TypeScript frontend for the HR Management System.

## 🌐 Live Demo

**Production**: https://hr-app-frontend-tevw.onrender.com

## 🛠️ Tech Stack

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.6.3
- **Build Tool**: Vite 5.4.21
- **Styling**: Tailwind CSS 3.4.15
- **State Management**: TanStack React Query 5.8.4
- **HTTP Client**: Axios 1.6.2
- **Routing**: React Router DOM 6.28.0
- **Forms**: React Hook Form 7.48.2 + Zod 3.23.8
- **Icons**: Lucide React 0.454.0

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Configuration

### Environment Variables

Create `.env.production` for production deployment:

```env
VITE_API_BASE_URL=https://hr-app-sofb.onrender.com/api/v1
```

For local development, create `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### API Integration

The frontend communicates with the backend via the `api-client.ts`:

```typescript
// src/lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AppLayout.tsx   # Main layout with sidebar
│   │   └── ProtectedRoute.tsx # Auth guards
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── lib/                # Core libraries
│   │   ├── api.ts          # Axios instance
│   │   ├── api-client.ts   # API client functions
│   │   ├── queryClient.ts  # React Query config
│   │   └── types.ts        # TypeScript types
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── FeedbackPage.tsx
│   │   ├── ChannelsPage.tsx
│   │   ├── AnnouncementsPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── AdminPage.tsx
│   ├── App.tsx             # Root component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind styles
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## 🎨 Key Features

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes with role-based access
- Login page with demo account buttons

### State Management
- TanStack Query for server state
- React Context for auth state
- Automatic cache invalidation
- Optimistic updates

### UI Components
- Responsive sidebar navigation
- Real-time notification badges
- Loading states and error handling
- Toast notifications
- Modal dialogs

### Routing
```typescript
// Protected routes with role-based access
<Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']} />}>
  <Route path="/admin" element={<AdminPage />} />
</Route>
```

## 🧪 Available Scripts

```bash
# Development server (hot reload)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🚀 Deployment to Render

### Static Site Configuration

**Service Type**: Static Site  
**Build Command**: `npm install && npm run build`  
**Publish Directory**: `dist`  
**Root Directory**: `frontend`

### Environment Variables

Set in Render Dashboard → Environment:

```
VITE_API_BASE_URL=https://hr-app-sofb.onrender.com/api/v1
```

### Deploy Steps

1. **Connect Repository**
   - Link GitHub repository: `Liwei1020T/HR_APP`
   - Select `frontend` as root directory

2. **Configure Build**
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**
   - Add `VITE_API_BASE_URL` with production backend URL

4. **Deploy**
   - Click "Create Static Site"
   - Wait for build to complete (~2-3 minutes)

### Auto-Deploy

Automatic deployments trigger on:
- Push to `main` branch
- Changes in `frontend/` directory

## 🔧 Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR - changes reflect immediately without full page reload.

### Type Safety

All API responses are typed. Add types to `src/lib/types.ts`:

```typescript
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department?: string;
}
```

### API Client Usage

```typescript
import { authApi, usersApi } from '@/lib/api-client';

// Login
const { data } = await authApi.login({ email, password });

// Fetch users
const users = await usersApi.getAll();
```

### React Query Hooks

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => usersApi.getAll(),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (data) => feedbackApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['feedback']);
  },
});
```

## 🐛 Troubleshooting

### CORS Errors

Ensure backend `CORS_ORIGINS` includes your frontend URL:
```
CORS_ORIGINS=https://hr-app-frontend-tevw.onrender.com
```

### API Connection Failed

Check `VITE_API_BASE_URL` in `.env.production` or Render environment variables.

### Build Fails

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: requires 18+
- Verify all dependencies are listed in `package.json`

### Type Errors

Run type checking:
```bash
npm run type-check
```

## 📦 Dependencies

### Core
- `react` & `react-dom` - UI library
- `typescript` - Type safety
- `vite` - Build tool

### Routing
- `react-router-dom` - Client-side routing

### State Management
- `@tanstack/react-query` - Server state
- `axios` - HTTP client

### UI & Styling
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icons

### Forms
- `react-hook-form` - Form management
- `zod` - Schema validation

## 🔐 Security

- No sensitive data in localStorage (tokens in memory)
- Automatic CSRF protection via SameSite cookies
- XSS protection via React auto-escaping
- Input validation with Zod schemas
- Secure HTTP headers from Vite

## 📞 Support

- **Issues**: Check browser console for errors
- **API Errors**: Verify backend is running and CORS configured
- **Build Issues**: Check Render build logs

---

**Part of HR Management System**  
**Backend**: https://hr-app-sofb.onrender.com
