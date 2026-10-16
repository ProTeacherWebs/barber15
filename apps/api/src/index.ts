import Fastify from "fastify";
import { ensureAdmin } from "./adminAuth.js";
import { registerRoutes } from "./routes.js";
import { installMenu } from "./bot.js";
import { prisma } from "./prisma.js";

const app = Fastify({ logger: true, bodyLimit: 4 * 1024 * 1024 });
registerRoutes(app);

try {
  await app.ready();
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3001);
app.listen({ host: "0.0.0.0", port }).catch(async (error: unknown) => {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

ensureAdmin().catch((error: unknown) => {
  app.log.error(error);
});
installMenu().catch((error: unknown) => {
  app.log.error(error);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    app
      .close()
      .then(() => prisma.$disconnect())
      .finally(() => process.exit(0));
  });
}
