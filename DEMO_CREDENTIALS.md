# Demo Credentials - Quick Reference

## Easy Demo Accounts (New - P@ssw0rd!)

These accounts are designed for quick demos and testing:

### 🎭 Superadmin Account
```
Email: sa@demo.local
Password: P@ssw0rd!
Role: SUPERADMIN
```
**Access:** Full system access, all features, admin panel, user management

### ⚙️ Admin Account
```
Email: admin@demo.local
Password: P@ssw0rd!
Role: ADMIN
```
**Access:** Admin panel, user management, feedback management, system metrics

### 👤 Employee Account
```
Email: user@demo.local
Password: P@ssw0rd!
Role: EMPLOYEE
```
**Access:** Basic features, submit feedback, join channels, view announcements

---

## Alternative Accounts (Legacy - password123)

These accounts use the older password format:

### 💼 HR Manager
```
Email: hr@company.com
Password: password123
Role: HR
```
**Access:** HR panel, feedback management, announcements, user viewing

### 👔 Admin User
```
Email: admin@company.com
Password: password123
Role: ADMIN
```
**Access:** Admin features, system management

### 👥 Regular Employees
```
Email: john.doe@company.com
Password: password123
Role: EMPLOYEE
---
Email: jane.smith@company.com
Password: password123
Role: EMPLOYEE
---
Email: bob.johnson@company.com
Password: password123
Role: EMPLOYEE
---
Email: alice.williams@company.com
Password: password123
Role: EMPLOYEE
```

---

## Quick Login Buttons

The login page now includes **one-click demo buttons** for:
- 👤 **Employee** - Click to auto-login as `user@demo.local`
- 💼 **HR** - Click to auto-login as `hr@company.com`
- ⚙️ **Admin** - Click to auto-login as `admin@demo.local`
- 👑 **Superadmin** - Click to auto-login as `sa@demo.local`

## Testing Different Features by Role

### As Employee (`user@demo.local`):
✅ View dashboard with personal metrics
✅ Submit feedback
✅ Join public channels
✅ View announcements
✅ Receive notifications
❌ Cannot access admin panel
❌ Cannot manage users

### As HR (`hr@company.com`):
✅ Everything Employee can do, plus:
✅ View all feedback (not just own)
✅ Update feedback status
✅ Create announcements
✅ Assign feedback to users
❌ Cannot access full admin metrics

### As Admin (`admin@demo.local`):
✅ Everything HR can do, plus:
✅ Access admin panel
✅ View system metrics
✅ Manage user roles
✅ Manage user status (activate/deactivate)
✅ View audit logs
✅ Full system oversight

### As Superadmin (`sa@demo.local`):
✅ **FULL ACCESS** to everything
✅ All admin features
✅ All HR features
✅ All employee features
✅ System-wide permissions

---

## Quick Demo Scenarios

### Scenario 1: Employee Feedback Flow
1. Login as **Employee** (`user@demo.local`)
2. Go to **Feedback** page
3. Click "Submit Feedback"
4. Fill in details and submit
5. Logout and login as **HR** (`hr@company.com`)
6. View the feedback and change status to "Under Review"
7. Add a comment

### Scenario 2: Channel Communication
1. Login as **Employee** 
2. Go to **Channels** page
3. Join "General" channel
4. View members
5. Login as different employee to see multiple users in channel

### Scenario 3: Admin User Management
1. Login as **Admin** (`admin@demo.local`)
2. Go to **Admin** page
3. View system metrics
4. Click on Users section
5. Change a user's role or status
6. View audit logs to see the change recorded

### Scenario 4: Announcements
1. Login as **HR** or **Admin**
2. Go to **Announcements** page
3. Create a new announcement
4. Pin it to the top
5. Logout and login as **Employee**
6. See the pinned announcement on dashboard

---

## Database Reset (If Needed)

To reset the database to initial state:

```powershell
cd "nextjs-backend"
npx prisma migrate reset
npx prisma db seed
```

This will:
- Drop all tables
- Run migrations
- Seed with all demo accounts and data

---

## Production Notes

⚠️ **Before deploying to production:**

1. **Change all passwords** - Use strong, unique passwords
2. **Remove demo accounts** - Delete or disable test accounts
3. **Update .env** - Use production database and secrets
4. **Enable HTTPS** - Secure all connections
5. **Set up proper email** - Configure real email service
6. **Configure storage** - Use AWS S3 or similar for file uploads
7. **Enable monitoring** - Set up logging and error tracking

---

## Support

For issues or questions:
- Check `SETUP.md` for setup instructions
- Check `API_FIXES.md` for API documentation
- View `IMPLEMENTATION.md` for architecture details

**Current Status:** ✅ All features working with SQLite database
