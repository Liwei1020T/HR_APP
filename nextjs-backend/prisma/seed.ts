import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.directConversationParticipant.deleteMany();
  await prisma.directConversation.deleteMany();
  await prisma.feedbackComment.deleteMany();
  await prisma.file.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash passwords
  const demoPassword = await bcrypt.hash('P@ssw0rd!', 10);
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Create demo users (new credentials)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'sa@demo.local',
      password: demoPassword,
      fullName: 'Super Administrator',
      role: 'SUPERADMIN',
      department: 'Executive',
      dateOfBirth: new Date('1980-01-15'),
      employeeId: 'EMP-SUP-001',
      isActive: true,
    },
  });

  const demoAdmin = await prisma.user.create({
    data: {
      email: 'admin@demo.local',
      password: demoPassword,
      fullName: 'Demo Admin',
      role: 'ADMIN',
      department: 'IT',
      dateOfBirth: new Date('1985-03-03'),
      employeeId: 'EMP-ADM-001',
      isActive: true,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'user@demo.local',
      password: demoPassword,
      fullName: 'Demo Employee',
      role: 'EMPLOYEE',
      department: 'Sales',
      dateOfBirth: new Date('1990-05-20'),
      employeeId: 'EMP-EMP-001',
      isActive: true,
    },
  });

  // Create existing users (keep backward compatibility)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: defaultPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      department: 'IT',
      dateOfBirth: new Date('1988-02-10'),
      employeeId: 'EMP-ADMIN-001',
      isActive: true,
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      email: 'hr@company.com',
      password: defaultPassword,
      fullName: 'HR Manager',
      role: 'HR',
      department: 'Human Resources',
      dateOfBirth: new Date('1987-04-05'),
      employeeId: 'EMP-HR-001',
      isActive: true,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'john.doe@company.com',
      password: defaultPassword,
      fullName: 'John Doe',
      role: 'EMPLOYEE',
      department: 'Engineering',
      dateOfBirth: new Date('1992-08-12'),
      employeeId: 'EMP-ENG-001',
      isActive: true,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'jane.smith@company.com',
      password: defaultPassword,
      fullName: 'Jane Smith',
      role: 'EMPLOYEE',
      department: 'Marketing',
      dateOfBirth: new Date('1991-09-23'),
      employeeId: 'EMP-MKT-001',
      isActive: true,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      email: 'bob.johnson@company.com',
      password: defaultPassword,
      fullName: 'Bob Johnson',
      role: 'EMPLOYEE',
      department: 'Sales',
      dateOfBirth: new Date('1993-11-30'),
      employeeId: 'EMP-SLS-001',
      isActive: true,
    },
  });

  const employee4 = await prisma.user.create({
    data: {
      email: 'alice.williams@company.com',
      password: defaultPassword,
      fullName: 'Alice Williams',
      role: 'EMPLOYEE',
      department: 'Engineering',
      dateOfBirth: new Date('1994-12-08'),
      employeeId: 'EMP-ENG-002',
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
      category: 'WORKPLACE',
      status: 'SUBMITTED',
      isAnonymous: false,
      submittedBy: employee1.id,
    },
  });

  const feedback2 = await prisma.feedback.create({
    data: {
      title: 'Request for remote work policy',
      description: 'Would like to see a more flexible remote work policy implemented.',
      category: 'MANAGEMENT',
      status: 'UNDER_REVIEW',
      isAnonymous: false,
      submittedBy: employee2.id,
      assignedTo: hrManager.id,
    },
  });

  const feedback3 = await prisma.feedback.create({
    data: {
      title: 'Health insurance concerns',
      description: 'The current health insurance plan has limited coverage. Would like better options.',
      category: 'BENEFITS',
      status: 'IN_PROGRESS',
      isAnonymous: true,
      submittedBy: employee3.id,
      assignedTo: hrManager.id,
    },
  });

  const feedback4 = await prisma.feedback.create({
    data: {
      title: 'Positive team culture',
      description: 'Really enjoying the collaborative culture in the engineering team!',
      category: 'CULTURE',
      status: 'RESOLVED',
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
        title: 'Welcome to the HR APP',
        content: 'We are excited to launch our new HR feedback portal. Please share your thoughts!',
        category: 'COMPANY_NEWS',
        isPinned: true,
        isActive: true,
        createdBy: admin.id,
      },
      {
        title: 'New Health Benefits',
        content: 'We are adding dental and vision coverage to our health insurance plans starting next month.',
        category: 'BENEFIT',
        isPinned: false,
        isActive: true,
        createdBy: hrManager.id,
      },
      {
        title: 'Annual Performance Reviews',
        content: 'Performance review season is here. Please schedule your 1-on-1 with your manager.',
        category: 'HR_POLICY',
        isPinned: false,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: hrManager.id,
      },
      {
        title: 'Company Holiday Party',
        content: 'Join us for our annual holiday party on December 15th! RSVP by December 1st.',
        category: 'EVENT',
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
        message: 'Welcome to the HR APP',
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

  // Create sample direct conversation with messages
  const sampleParticipantKey = `${Math.min(employee1.id, employee2.id)}:${Math.max(employee1.id, employee2.id)}`;
  const directConversation = await prisma.directConversation.create({
    data: {
      participantKey: sampleParticipantKey,
      topic: 'Product launch sync',
      createdBy: employee1.id,
      participants: {
        create: [
          { userId: employee1.id },
          { userId: employee2.id },
        ],
      },
    },
  });

  const firstDirectMessage = await prisma.directMessage.create({
    data: {
      conversationId: directConversation.id,
      senderId: employee1.id,
      content: 'Hey Jane, wanted to sync up about the launch tasks.',
    },
  });

  const secondDirectMessage = await prisma.directMessage.create({
    data: {
      conversationId: directConversation.id,
      senderId: employee2.id,
      content: 'Sure thing! I can chat after lunch today.',
    },
  });

  await prisma.directConversation.update({
    where: { id: directConversation.id },
    data: {
      lastMessageAt: secondDirectMessage.createdAt,
    },
  });

  await prisma.directConversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId: directConversation.id,
        userId: employee1.id,
      },
    },
    data: {
      lastReadMessageId: secondDirectMessage.id,
    },
  });

  await prisma.directConversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId: directConversation.id,
        userId: employee2.id,
      },
    },
    data: {
      lastReadMessageId: firstDirectMessage.id,
    },
  });

  console.log('✅ Created sample direct conversation and messages');


  // Create sample birthday event for August
  const seedYear = new Date().getUTCFullYear();
  const birthdayEventMonth = 8;
  const birthdayEvent = await prisma.birthdayEvent.create({
    data: {
      year: seedYear,
      month: birthdayEventMonth,
      eventDate: new Date(Date.UTC(seedYear, birthdayEventMonth - 1, 25, 15, 0, 0)),
      title: 'August Birthday Celebration',
      description: 'Celebrate all August birthdays with cake and games!',
      location: 'Main Town Hall',
      createdById: hrManager.id,
    },
  });

  const augustBirthdayUsers = await prisma.user.findMany({
    where: {
      dateOfBirth: { not: null },
      isActive: true,
    },
  });

  const eligibleAugust = augustBirthdayUsers.filter(
    (user) => user.dateOfBirth && user.dateOfBirth.getUTCMonth() + 1 === birthdayEventMonth
  );

  for (const [index, user] of eligibleAugust.entries()) {
    await prisma.birthdayRegistration.create({
      data: {
        eventId: birthdayEvent.id,
        userId: user.id,
        rsvpStatus: index % 2 === 0 ? 'going' : 'pending',
        rsvpAt: index % 2 === 0 ? new Date() : null,
      },
    });
  }

  console.log('?? Created sample birthday event and registrations');


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
  console.log('📧 Demo Accounts (P@ssw0rd!):');
  console.log('  SUPERADMIN: sa@demo.local / P@ssw0rd!');
  console.log('  ADMIN:      admin@demo.local / P@ssw0rd!');
  console.log('  EMPLOYEE:   user@demo.local / P@ssw0rd!');
  console.log('');
  console.log('📧 Alternative Accounts (password123):');
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
