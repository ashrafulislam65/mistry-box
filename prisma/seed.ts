import dotenv from "dotenv";
dotenv.config();
import { PrismaClient, AdminRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@mistrybox.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  const categories = [
    { name: "Basic Mistry Box", slug: "basic-mistry-box", description: "রোজকার ছোটখাটো কাজের জন্য বেসিক টুলস" },
    { name: "Pro Mistry Box", slug: "pro-mistry-box", description: "হোম ইম্প্রুভমেন্ট ও প্রফেশনাল কাজের জন্য" },
    { name: "Combo Mistry Box", slug: "combo-mistry-box", description: "সব ধরনের কাজের জন্য কমপ্লিট সেট" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const basic = await prisma.category.findUnique({ where: { slug: "basic-mistry-box" } });

  if (basic) {
    await prisma.package.upsert({
      where: { slug: "59-taka-mistry-box" },
      update: {},
      create: {
        categoryId: basic.id,
        name: "৫৯ টাকার মিস্ত্রি বক্স",
        slug: "59-taka-mistry-box",
        price: 59,
        description: "ছোটখাটো ঘরোয়া কাজের জন্য প্রয়োজনীয় বেসিক টুলস নিয়ে এই মিস্ত্রি বক্স।",
        items: ["স্ক্রু ড্রাইভার", "মেজারিং টেপ", "ছোট প্লায়ার্স", "টেপ"],
        isActive: true,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login -> email: ${adminEmail} | password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });