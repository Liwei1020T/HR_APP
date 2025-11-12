const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'admin@company.com';
    const password = 'password123';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    console.log('\n📝 Password hash:', user.password.substring(0, 60));
    
    // Test password
    const isValid = await bcrypt.compare(password, user.password);
    console.log('\n🔐 Password match:', isValid);
    
    if (!isValid) {
      console.log('\n❌ Password verification failed!');
      console.log('Testing with new hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('New hash:', newHash);
      const testAgain = await bcrypt.compare(password, newHash);
      console.log('New hash works:', testAgain);
    } else {
      console.log('\n✅ Login would succeed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
