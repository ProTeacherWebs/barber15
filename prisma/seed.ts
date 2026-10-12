import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  {
    id: "cut",
    name: "Мужская стрижка",
    description: "Форма, фейд или классика",
    durationMin: 45,
    price: 80_000,
    sortOrder: 0,
  },
  {
    id: "cut-beard",
    name: "Стрижка и борода",
    description: "Волосы и борода за один визит",
    durationMin: 75,
    price: 130_000,
    sortOrder: 1,
  },
  {
    id: "beard",
    name: "Моделирование бороды",
    description: "Контур, длина и уход",
    durationMin: 30,
    price: 60_000,
    sortOrder: 2,
  },
  {
    id: "shave",
    name: "Королевское бритьё",
    description: "Горячее полотенце и опасная бритва",
    durationMin: 40,
    price: 70_000,
    sortOrder: 3,
  },
  {
    id: "kids",
    name: "Детская стрижка",
    description: "До 12 лет",
    durationMin: 30,
    price: 50_000,
    sortOrder: 4,
  },
  {
    id: "grey",
    name: "Камуфляж седины",
    description: "Точечно, без сплошного окрашивания",
    durationMin: 25,
    price: 45_000,
    sortOrder: 5,
  },
];

const barbers = [
  {
    id: "aziz",
    name: "Азиз Каримов",
    photoUrl: "/barbers/aziz.jpg",
    bio: "Фейд и короткая форма. Спокойно работает с густыми волосами.",
    experienceYears: 8,
    sortOrder: 0,
    serviceIds: ["cut", "cut-beard", "grey"],
  },
  {
    id: "timur",
    name: "Тимур Юсупов",
    photoUrl: "/barbers/timur.jpg",
    bio: "Борода и бритьё. Держит линию усов и контур шеи.",
    experienceYears: 6,
    sortOrder: 1,
    serviceIds: ["beard", "shave", "cut-beard"],
  },
  {
    id: "sanjar",
    name: "Санжар Алиев",
    photoUrl: "/barbers/sanjar.jpg",
    bio: "Классика и детские стрижки. Объясняет ход работы, если просите.",
    experienceYears: 12,
    sortOrder: 2,
    serviceIds: ["cut", "kids", "shave"],
  },
];

const settings = [
  ["cancel_cutoff_min", "30"],
  ["slot_step_min", "15"],
  ["booking_horizon_days", "30"],
  ["min_notice_min", "30"],
  ["reminder_day_minutes", "1440"],
  ["reminder_short_minutes", "30"],
  ["review_delay_min", "60"],
  ["timezone", "Asia/Tashkent"],
  ["review_public_min_rating", "4"],
] as const;

function clock(hours: number, minutes = 0): Date {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: service,
      create: service,
    });
  }

  for (const barber of barbers) {
    const { serviceIds, ...data } = barber;
    await prisma.barber.upsert({
      where: { id: barber.id },
      update: data,
      create: data,
    });

    for (const serviceId of serviceIds) {
      await prisma.barberService.upsert({
        where: { barberId_serviceId: { barberId: barber.id, serviceId } },
        update: { isEnabled: true },
        create: { barberId: barber.id, serviceId, isEnabled: true },
      });
    }

    for (let weekday = 1; weekday <= 7; weekday += 1) {
      const id = `${barber.id}-${weekday}`;
      const hours = {
        barberId: barber.id,
        weekday,
        startTime: clock(10),
        endTime: clock(21),
      };
      await prisma.workingHours.upsert({
        where: { id },
        update: hours,
        create: { id, ...hours },
      });
    }
  }

  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
