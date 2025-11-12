import { PrismaClient, UserRole, FeedbackStatus, FeedbackCategory, AnnouncementCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.feedbackComment.deleteMany();
  await prisma.file.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users
  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@company.com',
      password: hashedPassword,
      fullName: 'Super Admin',
      role: UserRole.SUPERADMIN,
      department: 'IT',
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      department: 'IT',
      isActive: true,
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      email: 'hr@company.com',
      password: hashedPassword,
      fullName: 'HR Manager',
      role: UserRole.HR,
      department: 'Human Resources',
      isActive: true,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'john.doe@company.com',
      password: hashedPassword,
      fullName: 'John Doe',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      isActive: true,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'jane.smith@company.com',
      password: hashedPassword,
      fullName: 'Jane Smith',
      role: UserRole.EMPLOYEE,
      department: 'Marketing',
      isActive: true,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      email: 'bob.johnson@company.com',
      password: hashedPassword,
      fullName: 'Bob Johnson',
      role: UserRole.EMPLOYEE,
      department: 'Sales',
      isActive: true,
    },
  });

  const employee4 = await prisma.user.create({
    data: {
      email: 'alice.williams@company.com',
      password: hashedPassword,
      fullName: 'Alice Williams',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      isActive: true,
    },
  });

  console.log('✅ Created 7 users');

  // Create channels
  const generalChannel = await prisma.channel.create({
    data: {
      name: 'General Announcements',
      description: 'Company-wide announcements and updates',
      channelType: 'announcement',
      isPrivate: false,
      createdBy: admin.id,
    },
  });

  const hrChannel = await prisma.channel.create({
    data: {
      name: 'HR Updates',
      description: 'Human Resources policies and updates',
      channelType: 'hr',
      isPrivate: false,
      createdBy: hrManager.id,
    },
  });

  const engChannel = await prisma.channel.create({
    data: {
      name: 'Engineering Team',
      description: 'Engineering team discussions',
      channelType: 'team',
      isPrivate: true,
      createdBy: employee1.id,
    },
  });

  console.log('✅ Created 3 channels');

  // Create channel memberships
  await prisma.channelMember.createMany({
    data: [
      { userId: admin.id, channelId: generalChannel.id, role: 'MODERATOR' },
      { userId: hrManager.id, channelId: generalChannel.id, role: 'MEMBER' },
      { userId: employee1.id, channelId: generalChannel.id, role: 'MEMBER' },
      { userId: employee2.id, channelId: generalChannel.id, role: 'MEMBER' },
      { userId: hrManager.id, channelId: hrChannel.id, role: 'MODERATOR' },
      { userId: employee1.id, channelId: hrChannel.id, role: 'MEMBER' },
      { userId: employee2.id, channelId: hrChannel.id, role: 'MEMBER' },
      { userId: employee1.id, channelId: engChannel.id, role: 'MODERATOR' },
      { userId: employee4.id, channelId: engChannel.id, role: 'MEMBER' },
    ],
  });

  console.log('✅ Created channel memberships');

  // Create feedback
  const feedback1 = await prisma.feedback.create({
    data: {
      title: 'Improve office ergonomics',
      description: 'The current desk chairs are causing back pain. We need better ergonomic furniture.',
      category: FeedbackCategory.WORKPLACE,
      status: FeedbackStatus.SUBMITTED,
      isAnonymous: false,
      submittedBy: employee1.id,
    },
  });

  const feedback2 = await prisma.feedback.create({
    data: {
      title: 'Request for remote work policy',
      description: 'Would like to see a more flexible remote work policy implemented.',
      category: FeedbackCategory.MANAGEMENT,
      status: FeedbackStatus.UNDER_REVIEW,
      isAnonymous: false,
      submittedBy: employee2.id,
      assignedTo: hrManager.id,
    },
  });

  const feedback3 = await prisma.feedback.create({
    data: {
      title: 'Health insurance concerns',
      description: 'The current health insurance plan has limited coverage. Would like better options.',
      category: FeedbackCategory.BENEFITS,
      status: FeedbackStatus.IN_PROGRESS,
      isAnonymous: true,
      submittedBy: employee3.id,
      assignedTo: hrManager.id,
    },
  });

  const feedback4 = await prisma.feedback.create({
    data: {
      title: 'Positive team culture',
      description: 'Really enjoying the collaborative culture in the engineering team!',
      category: FeedbackCategory.CULTURE,
      status: FeedbackStatus.RESOLVED,
      isAnonymous: false,
      submittedBy: employee4.id,
      assignedTo: hrManager.id,
    },
  });

  console.log('✅ Created 4 feedback items');

  // Create feedback comments
  await prisma.feedbackComment.createMany({
    data: [
      {
        feedbackId: feedback2.id,
        userId: hrManager.id,
        comment: 'Thank you for your feedback. We are reviewing remote work options.',
        isInternal: false,
      },
      {
        feedbackId: feedback3.id,
        userId: hrManager.id,
        comment: 'Working with insurance providers to improve coverage.',
        isInternal: true,
      },
    ],
  });

  console.log('✅ Created feedback comments');

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to the HR Portal',
        content: 'We are excited to launch our new HR feedback portal. Please share your thoughts!',
        category: AnnouncementCategory.COMPANY_NEWS,
        isPinned: true,
        isActive: true,
        createdBy: admin.id,
      },
      {
        title: 'New Health Benefits',
        content: 'We are adding dental and vision coverage to our health insurance plans starting next month.',
        category: AnnouncementCategory.BENEFIT,
        isPinned: false,
        isActive: true,
        createdBy: hrManager.id,
      },
      {
        title: 'Annual Performance Reviews',
        content: 'Performance review season is here. Please schedule your 1-on-1 with your manager.',
        category: AnnouncementCategory.HR_POLICY,
        isPinned: false,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: hrManager.id,
      },
      {
        title: 'Company Holiday Party',
        content: 'Join us for our annual holiday party on December 15th! RSVP by December 1st.',
        category: AnnouncementCategory.EVENT,
        isPinned: true,
        isActive: true,
        createdBy: admin.id,
      },
    ],
  });

  console.log('✅ Created 4 announcements');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: employee1.id,
        type: 'ANNOUNCEMENT',
        title: 'New Announcement',
        message: 'Welcome to the HR Portal',
        isRead: false,
        relatedEntityType: 'announcement',
        relatedEntityId: 1,
      },
      {
        userId: hrManager.id,
        type: 'FEEDBACK',
        title: 'New Feedback Submitted',
        message: 'Request for remote work policy',
        isRead: false,
        relatedEntityType: 'feedback',
        relatedEntityId: feedback2.id,
      },
      {
        userId: employee2.id,
        type: 'FEEDBACK',
        title: 'Feedback Status Updated',
        message: 'Your feedback status changed to UNDER_REVIEW',
        isRead: true,
        relatedEntityType: 'feedback',
        relatedEntityId: feedback2.id,
      },
    ],
  });

  console.log('✅ Created notifications');

  // Create audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'CREATE_CHANNEL',
        entityType: 'channel',
        entityId: generalChannel.id,
        details: 'Created General Announcements channel',
        ipAddress: '127.0.0.1',
      },
      {
        userId: employee1.id,
        action: 'CREATE_FEEDBACK',
        entityType: 'feedback',
        entityId: feedback1.id,
        details: 'Submitted feedback: Improve office ergonomics',
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('✅ Created audit logs');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📧 Test Users:');
  console.log('  SUPERADMIN: superadmin@company.com / password123');
  console.log('  ADMIN:      admin@company.com / password123');
  console.log('  HR:         hr@company.com / password123');
  console.log('  EMPLOYEE:   john.doe@company.com / password123');
  console.log('  EMPLOYEE:   jane.smith@company.com / password123');
  console.log('  EMPLOYEE:   bob.johnson@company.com / password123');
  console.log('  EMPLOYEE:   alice.williams@company.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
