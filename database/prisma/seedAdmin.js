import { prisma } from '../client/prismaClient.js';
import { hashPassword } from 'better-auth/crypto';

export async function seedAdmin({
  email = process.env.ADMIN_EMAIL || 'kotlin.hustlehub@gmail.com',
  name = 'System Administrator',
  password = process.env.ADMIN_PASSWORD || 'Admin123456!'
} = {}) {
  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await hashPassword(password);

  const role = await prisma.role.findUnique({
    where: { code: 'ADMINISTRATOR' }
  });

  if (!role) {
    throw new Error('ADMINISTRATOR role not found. Please run "npm run db:seed" first.');
  }

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name,
      emailVerified: true,
      status: 'ACTIVE'
    },
    create: {
      name,
      email: normalizedEmail,
      emailVerified: true,
      status: 'ACTIVE'
    }
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: user.id
      }
    },
    update: {
      password: hashedPassword
    },
    create: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: hashedPassword
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  console.log('----------------------------------------------------');
  console.log('✅ Super Administrator Provisioned Successfully:');
  console.log(`   Email:    ${normalizedEmail}`);
  console.log(`   Password: ${password}`);
  console.log('   Role:     ADMINISTRATOR (Super Admin)');
  console.log('   Access:   http://localhost:5173/admin/users');
  console.log('----------------------------------------------------');

  return user;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  seedAdmin()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error('Failed to seed admin:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
