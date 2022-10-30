import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // The only Staff member
  await prisma.staff.create({
    data: {
      email: "staff@ob.io",
      password: "123456",
    },
  });

  // Functionalities
  const newsletter = await prisma.functionality.create({
    data: { name: "Newsletter" },
  });
  const door = await prisma.functionality.create({
    data: { name: "Porte" },
  });
  const shower = await prisma.functionality.create({
    data: { name: "Douche" },
  });

  const lille = await prisma.partner.create({
    data: {
      email: "lille@ob.io",
      password: "123456",
      city: "Lille",
      structures: {
        create: [
          {
            street: "Grand Place",
            email: "grandplace@ob.io",
            password: "123456",
            active: true,
            functionalities: {
              connect: [
                {
                  id: door.id,
                },
                {
                  id: newsletter.id,
                },
              ],
            },
          },
          {
            street: "Vieux Lille",
            email: "vieuxlille@ob.io",
            password: "123456",
            active: false,
            functionalities: {
              connect: [
                {
                  id: shower.id,
                },
              ],
            },
          },
        ],
      },
    },
  });
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
