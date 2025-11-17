-- ============================================
-- HR APP - PostgreSQL Database Setup Script
-- ============================================
-- This script creates all tables matching Prisma schema exactly
-- Run this script in PostgreSQL to set up the database manually
-- Compatible with Prisma migrations - no migration needed after running
-- ============================================

-- Create database (run this separately if needed)
-- CREATE DATABASE hr_app_db;
-- \c hr_app_db;

-- Drop existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS birthday_registrations CASCADE;
DROP TABLE IF EXISTS birthday_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS feedback_comments CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS channel_messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'EMPLOYEE' NOT NULL,
    department TEXT,
    employee_id TEXT UNIQUE,
    date_of_birth TIMESTAMP(3),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE UNIQUE INDEX users_employee_id_key ON users(employee_id) WHERE employee_id IS NOT NULL;

-- ============================================
-- TABLE: channels
-- ============================================
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    channel_type TEXT DEFAULT 'general' NOT NULL,
    is_private BOOLEAN DEFAULT false NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    CONSTRAINT channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX channels_created_by_idx ON channels(created_by);

-- ============================================
-- TABLE: channel_members
-- ============================================
CREATE TABLE channel_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    role TEXT DEFAULT 'MEMBER' NOT NULL,
    joined_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT channel_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT channel_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX channel_members_user_id_channel_id_key ON channel_members(user_id, channel_id);
CREATE UNIQUE INDEX channel_members_channel_id_user_id_key ON channel_members(channel_id, user_id);
CREATE INDEX channel_members_user_id_idx ON channel_members(user_id);
CREATE INDEX channel_members_channel_id_idx ON channel_members(channel_id);

-- ============================================
-- TABLE: channel_messages
-- ============================================
CREATE TABLE channel_messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_announcement BOOLEAN DEFAULT false NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    pinned_at TIMESTAMP(3),
    CONSTRAINT channel_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    CONSTRAINT channel_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT channel_messages_member_fk FOREIGN KEY (channel_id, user_id) REFERENCES channel_members(channel_id, user_id)
);

CREATE INDEX channel_messages_channel_id_idx ON channel_messages(channel_id);
CREATE INDEX channel_messages_user_id_idx ON channel_messages(user_id);

-- ============================================
-- TABLE: feedback
-- ============================================
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'GENERAL' NOT NULL,
    status TEXT DEFAULT 'SUBMITTED' NOT NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    submitted_by INTEGER NOT NULL,
    assigned_to INTEGER,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    CONSTRAINT feedback_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT feedback_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX feedback_submitted_by_idx ON feedback(submitted_by);
CREATE INDEX feedback_assigned_to_idx ON feedback(assigned_to);
CREATE INDEX feedback_status_idx ON feedback(status);

-- ============================================
-- TABLE: feedback_comments
-- ============================================
CREATE TABLE feedback_comments (
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT feedback_comments_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    CONSTRAINT feedback_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX feedback_comments_feedback_id_idx ON feedback_comments(feedback_id);
CREATE INDEX feedback_comments_user_id_idx ON feedback_comments(user_id);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    related_entity_type TEXT,
    related_entity_id INTEGER,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);

-- ============================================
-- TABLE: announcements
-- ============================================
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'OTHER' NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMP(3),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX announcements_created_by_idx ON announcements(created_by);
CREATE INDEX announcements_is_active_idx ON announcements(is_active);

-- ============================================
-- TABLE: files
-- ============================================
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    scanner_status TEXT DEFAULT 'pending' NOT NULL,
    scanner_details TEXT,
    uploaded_by INTEGER NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    feedback_id INTEGER,
    announcement_id INTEGER,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT files_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE SET NULL,
    CONSTRAINT files_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE SET NULL
);

CREATE INDEX files_uploaded_by_idx ON files(uploaded_by);
CREATE INDEX files_feedback_id_idx ON files(feedback_id);
CREATE INDEX files_announcement_id_idx ON files(announcement_id);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- ============================================
-- TABLE: birthday_events
-- ============================================
CREATE TABLE birthday_events (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    event_date TIMESTAMP(3) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    CONSTRAINT birthday_events_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX birthday_events_year_month_key ON birthday_events(year, month);

-- ============================================
-- TABLE: birthday_registrations
-- ============================================
CREATE TABLE birthday_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rsvp_status TEXT DEFAULT 'pending' NOT NULL,
    rsvp_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT birthday_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES birthday_events(id) ON DELETE CASCADE,
    CONSTRAINT birthday_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX birthday_registrations_event_id_user_id_key ON birthday_registrations(event_id, user_id);
CREATE INDEX birthday_registrations_event_id_idx ON birthday_registrations(event_id);
CREATE INDEX birthday_registrations_user_id_idx ON birthday_registrations(user_id);

-- ============================================
-- DEMO DATA - USERS
-- ============================================
-- Password for all demo accounts: P@ssw0rd!
-- Bcrypt hash: $2b$10$YourHashHere (you'll need to generate this)

INSERT INTO users (email, password, full_name, role, department, employee_id, date_of_birth, is_active, created_at, updated_at) VALUES
-- Demo accounts (password: P@ssw0rd!)
('sa@demo.local', '$2b$10$2LuLzcisNlNgZrPfivAnhevjCsWtZEm5es/CbB.aktbQuzDWdWVu2', 'Super Administrator', 'SUPERADMIN', 'Executive', 'EMP-SUP-001', '1980-01-15', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@demo.local', '$2b$10$2LuLzcisNlNgZrPfivAnhevjCsWtZEm5es/CbB.aktbQuzDWdWVu2', 'Demo Admin', 'ADMIN', 'IT', 'EMP-ADM-001', '1985-03-03', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user@demo.local', '$2b$10$2LuLzcisNlNgZrPfivAnhevjCsWtZEm5es/CbB.aktbQuzDWdWVu2', 'Demo Employee', 'EMPLOYEE', 'Sales', 'EMP-EMP-001', '1990-05-20', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Additional users (password: password123)
('admin@company.com', '$2b$10$/GRRydnbO/9KD0FWrHLcJ.C48Mi8Kc4UjUTHMOsCE90zJYVQ84Z8G', 'Admin User', 'ADMIN', 'IT', 'EMP-ADMIN-001', '1988-02-10', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hr@company.com', '$2b$10$/GRRydnbO/9KD0FWrHLcJ.C48Mi8Kc4UjUTHMOsCE90zJYVQ84Z8G', 'HR Manager', 'HR', 'Human Resources', 'EMP-HR-001', '1987-04-05', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('john.doe@company.com', '$2b$10$/GRRydnbO/9KD0FWrHLcJ.C48Mi8Kc4UjUTHMOsCE90zJYVQ84Z8G', 'John Doe', 'EMPLOYEE', 'Engineering', 'EMP-ENG-001', '1992-08-12', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jane.smith@company.com', '$2b$10$/GRRydnbO/9KD0FWrHLcJ.C48Mi8Kc4UjUTHMOsCE90zJYVQ84Z8G', 'Jane Smith', 'EMPLOYEE', 'Marketing', 'EMP-MKT-001', '1991-06-25', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mike.wilson@company.com', '$2b$10$/GRRydnbO/9KD0FWrHLcJ.C48Mi8Kc4UjUTHMOsCE90zJYVQ84Z8G', 'Mike Wilson', 'EMPLOYEE', 'Sales', 'EMP-SLS-001', '1989-12-03', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- DEMO DATA - CHANNELS
-- ============================================
INSERT INTO channels (name, description, channel_type, is_private, created_by, created_at, updated_at) VALUES
('General', 'General company-wide discussions', 'general', false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Engineering Team', 'Engineering department channel', 'department', false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('HR Announcements', 'Official HR announcements and updates', 'announcement', false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sales Team', 'Sales department discussions', 'department', false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Random', 'Off-topic conversations and fun', 'social', false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- DEMO DATA - CHANNEL MEMBERS
-- ============================================
-- Add all users to General channel
INSERT INTO channel_members (user_id, channel_id, role) VALUES
(1, 1, 'MODERATOR'),
(2, 1, 'MODERATOR'),
(3, 1, 'MEMBER'),
(4, 1, 'MEMBER'),
(5, 1, 'MEMBER'),
(6, 1, 'MEMBER'),
(7, 1, 'MEMBER'),
(8, 1, 'MEMBER');

-- Add users to department channels
INSERT INTO channel_members (user_id, channel_id, role) VALUES
(6, 2, 'MODERATOR'), -- John to Engineering
(2, 2, 'MEMBER'),    -- Admin to Engineering
(5, 3, 'MODERATOR'), -- HR to HR Announcements
(1, 3, 'MODERATOR'),
(8, 4, 'MODERATOR'), -- Mike to Sales
(3, 4, 'MEMBER'),    -- Demo Employee to Sales
(7, 5, 'MEMBER');    -- Jane to Random

-- ============================================
-- DEMO DATA - CHANNEL MESSAGES
-- ============================================
INSERT INTO channel_messages (channel_id, user_id, content) VALUES
(1, 1, 'Welcome to the HR Portal! Feel free to share your thoughts and feedback.'),
(1, 5, 'Don''t forget to submit your timesheets by end of day Friday!'),
(2, 6, 'Team meeting scheduled for tomorrow at 10 AM to discuss Q1 roadmap.'),
(3, 5, 'New company policy updates have been posted. Please review by end of week.');

-- ============================================
-- DEMO DATA - ANNOUNCEMENTS
-- ============================================
INSERT INTO announcements (title, content, category, is_pinned, created_by, created_at, updated_at) VALUES
('Welcome to HR Portal', 'Welcome to our new HR Management System! This platform allows you to submit feedback, join channels, and stay updated with company announcements.', 'COMPANY_NEWS', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Annual Performance Reviews', 'Annual performance reviews will begin next month. Please schedule time with your managers.', 'HR_POLICY', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('New Office Hours', 'Starting next week, office hours will be 9 AM - 5 PM. Remote work policy remains flexible.', 'HR_POLICY', false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Team Building Event', 'Join us for our quarterly team building event on the 25th! Location and details to follow.', 'EVENT', false, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- DEMO DATA - FEEDBACK
-- ============================================
INSERT INTO feedback (title, description, category, status, is_anonymous, submitted_by, assigned_to, created_at, updated_at) VALUES
('Office Temperature', 'The office is too cold in the afternoons. Can we adjust the AC settings?', 'WORKPLACE', 'UNDER_REVIEW', false, 6, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Parking Space Request', 'We need more parking spaces for employees. The lot fills up by 9 AM.', 'WORKPLACE', 'SUBMITTED', false, 7, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Training Opportunities', 'Would love to see more professional development and training opportunities.', 'BENEFITS', 'IN_PROGRESS', false, 8, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Great Team Culture', 'Just wanted to say the team culture here is amazing! Keep it up.', 'CULTURE', 'RESOLVED', false, 3, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- DEMO DATA - FEEDBACK COMMENTS
-- ============================================
INSERT INTO feedback_comments (feedback_id, user_id, comment, is_internal) VALUES
(1, 5, 'Thank you for the feedback. We''re reviewing the AC settings with facilities.', false),
(3, 5, 'We''re working on a new training program. Will announce details soon!', false),
(4, 5, 'Thank you for the positive feedback!', false);

-- ============================================
-- DEMO DATA - NOTIFICATIONS
-- ============================================
INSERT INTO notifications (user_id, type, title, message, is_read, related_entity_type, related_entity_id) VALUES
(6, 'FEEDBACK_STATUS_CHANGED', 'Feedback Status Updated', 'Your feedback "Office Temperature" is now under review.', false, 'FEEDBACK', 1),
(8, 'FEEDBACK_STATUS_CHANGED', 'Feedback Status Updated', 'Your feedback "Training Opportunities" status changed to In Progress.', false, 'FEEDBACK', 3),
(3, 'ANNOUNCEMENT', 'New Announcement', 'New announcement: Welcome to HR Portal', false, 'ANNOUNCEMENT', 1),
(5, 'FEEDBACK_SUBMITTED', 'New Feedback Submitted', 'New feedback received: Office Temperature', true, 'FEEDBACK', 1);

-- ============================================
-- DEMO DATA - AUDIT LOGS
-- ============================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'USER_LOGIN', 'USER', 1, 'Super Administrator logged in'),
(2, 'USER_LOGIN', 'USER', 2, 'Demo Admin logged in'),
(5, 'FEEDBACK_ASSIGNED', 'FEEDBACK', 1, 'Assigned feedback to HR Manager'),
(5, 'FEEDBACK_STATUS_UPDATED', 'FEEDBACK', 1, 'Updated status to UNDER_REVIEW'),
(1, 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT', 1, 'Created announcement: Welcome to HR Portal');

-- ============================================
-- NOTES
-- ============================================
-- 1. You need to replace the password hashes with actual bcrypt hashes
--    Generate them using: bcrypt.hash('P@ssw0rd!', 10) or bcrypt.hash('password123', 10)
--
-- 2. Demo Accounts:
--    - sa@demo.local / P@ssw0rd! (SUPERADMIN)
--    - admin@demo.local / P@ssw0rd! (ADMIN)
--    - user@demo.local / P@ssw0rd! (EMPLOYEE)
--
-- 3. Legacy Accounts (for backward compatibility):
--    - admin@company.com / password123
--    - hr@company.com / password123
--    - john.doe@company.com / password123
--
-- 4. To generate real password hashes, run:
--    node -e "const bcrypt = require('bcrypt'); bcrypt.hash('P@ssw0rd!', 10).then(console.log)"
--
-- 5. After running this script, update your .env file:
--    DATABASE_URL="postgresql://username:password@localhost:5432/hr_app_db"
--
-- ============================================
-- END OF SCRIPT
-- ============================================
