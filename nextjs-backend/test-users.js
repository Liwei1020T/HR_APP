const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking database users...\n');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      isActive: true,
    },
    orderBy: {
      role: 'desc',
    },
  });

  console.log(`Total users: ${users.length}\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Department: ${user.department}`);
    console.log(`   Active: ${user.isActive}`);
    console.log('');
  });

  // Test stats for dashboard
  console.log('📈 Dashboard Stats:');
  const totalFeedback = await prisma.feedback.count();
  const activeFeedback = await prisma.feedback.count({
    where: { status: { not: 'CLOSED' } },
  });
  const totalAnnouncements = await prisma.announcement.count();
  const activeAnnouncements = await prisma.announcement.count({
    where: { isActive: true },
  });
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({
    where: { isActive: true },
  });
  const totalChannels = await prisma.channel.count();

  console.log(`  Total Feedback: ${totalFeedback}`);
  console.log(`  Active Feedback: ${activeFeedback}`);
  console.log(`  Total Announcements: ${totalAnnouncements}`);
  console.log(`  Active Announcements: ${activeAnnouncements}`);
  console.log(`  Total Users: ${totalUsers}`);
  console.log(`  Active Users: ${activeUsers}`);
  console.log(`  Total Channels: ${totalChannels}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
