const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = 'employee@test.com';
    const password = 'password';
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, name: 'Employee Test' },
      create: {
        email,
        name: 'Employee Test',
        passwordHash,
        role: 'EMPLOYEE'
      }
    });

    console.log('Upserted user:', user.id, user.email);
  } catch (err) {
    console.error('Failed to seed user:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
