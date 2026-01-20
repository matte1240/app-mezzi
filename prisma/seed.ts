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

  await ensureUser({
    email: "employee@example.com",
    name: "Employee User",
    password: "Employee123!",
    role: "EMPLOYEE",
  });

  console.log("\n� Creating sample vehicles...");

  const vehicle = await prisma.vehicle.upsert({
    where: { plate: "AB123CD" },
    update: {},
    create: {
      plate: "AB123CD",
      name: "Fiat Panda",
      type: "Car",
      status: "ACTIVE",
      serviceIntervalKm: 15000,
      registrationDate: new Date("2024-01-01"),
      notes: "Company fleet car #1",
    },
  });
  console.log(`✓ Created vehicle ${vehicle.name} (${vehicle.plate})`);

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
