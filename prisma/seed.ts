const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

// Define interfaces for our data structures
interface Scan {
  activity_name: string;
  activity_category: string;
  scanned_at: string;
}

interface UserData {
  name: string;
  email: string;
  phone?: string;
  badge_code: string;
  scans: Scan[];
}

// Update the type annotation for exampleData
const exampleData: UserData[] = JSON.parse(
  fs.readFileSync("./example_data.json", "utf-8")
);

async function main() {
  console.log("Seeding database...");

  // Update type annotations in the forEach
  const uniqueActivities = new Set<string>();
  exampleData.forEach((user: UserData) => {
    user.scans.forEach((scan: Scan) => {
      uniqueActivities.add(
        JSON.stringify({
          name: scan.activity_name,
          category: scan.activity_category,
        })
      );
    });
  });

  // Create activities
  for (const activityStr of uniqueActivities) {
    const activity = JSON.parse(activityStr as string);
    await prisma.activity.upsert({
      where: { name: activity.name },
      update: {},
      create: {
        name: activity.name,
        category: activity.category,
      },
    });
  }

  // Then create users and their scans
  for (const user of exampleData) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          badge_code: user.badge_code,
          scans: {
            create: await Promise.all(
              user.scans.map(async (scan: Scan) => {
                const activity = await prisma.activity.findUnique({
                  where: { name: scan.activity_name },
                });
                return {
                  activityId: activity!.id,
                  scanned_at: new Date(scan.scanned_at),
                };
              })
            ),
          },
        },
      });
    } catch (error: any) {
      if (error?.message?.includes("badge_code_not_empty")) {
        console.warn(`Warning: Empty badge code for user ${user.email}`);
      } else {
        console.error(`Error creating/updating user ${user.email}:`, error);
      }
      continue;
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
