import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type SeedRole = "EMPLOYEE" | "ADMIN";

async function ensureUser(params: {
  email: string;
  name: string;
  password: string;
  role: SeedRole;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    console.log(`- User ${params.email} already exists`);
    return existing;
  }

  const passwordHash = await hash(params.password, 10);

  const user = await prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      passwordHash,
      role: params.role,
    },
  });
  
  console.log(`✓ Created user ${params.email} (${params.role})`);
  return user;
}

async function main() {
  console.log("🌱 Starting database seed...\n");
  
  await ensureUser({
    email: "admin@example.com",
    name: "Admin User",
    password: "Admin123!",
    role: "ADMIN",
  });

  const employee = await ensureUser({
    email: "employee@example.com",
    name: "Employee User",
    password: "Employee123!",
    role: "EMPLOYEE",
  });

  console.log("\n📅 Creating sample time entries...");
  
  // Ensure example time entries exist for the employee. Use find/create per-entry
  // to make the seed idempotent (safe to run multiple times).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const entries = [
    {
      userId: employee.id,
      workDate: today,
      hoursWorked: 8,
      overtimeHours: 0,
      permessoHours: 0,
      morningStart: "09:00",
      morningEnd: "13:00",
      afternoonStart: "14:00",
      afternoonEnd: "18:00",
      notes: "Project kickoff",
    },
    {
      userId: employee.id,
      workDate: yesterday,
      hoursWorked: 7.5,
      overtimeHours: 0,
      permessoHours: 0,
      morningStart: "09:00",
      morningEnd: "12:30",
      afternoonStart: "14:00",
      afternoonEnd: "18:00",
      notes: "Client follow-up",
    },
  ];

  for (const e of entries) {
    try {
      const exists = await prisma.timeEntry.findFirst({
        where: {
          userId: e.userId,
          workDate: e.workDate,
        },
      });

      if (!exists) {
        await prisma.timeEntry.create({ data: e });
        console.log(`✓ Created time entry for ${e.workDate.toISOString().split('T')[0]}`);
      } else {
        console.log(`- Time entry already exists for ${e.workDate.toISOString().split('T')[0]}`);
      }
    } catch (err: unknown) {
      // If schema mismatch (missing columns), warn but don't fail
      const error = err as { code?: string; message?: string };
      if (error?.code === 'P2022' || error?.message?.includes('column')) {
        console.warn(`⚠️  Could not create time entry: database schema may be outdated. Run migrations first.`);
        console.warn(`   Error: ${error.message}`);
        break;
      }
      console.error(`❌ Failed to create time entry:`, err);
      throw err;
    }
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("   Admin: admin@example.com / Admin123!");
  console.log("   Employee: employee@example.com / Employee123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
