import Fastify from "fastify";
import { ensureAdmin } from "./adminAuth";
import { registerRoutes } from "./app";
import { installMenu } from "./bot";
import { prisma } from "./prisma";

const app = Fastify({ logger: true, bodyLimit: 4 * 1024 * 1024 });
registerRoutes(app);

try {
  await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3001) });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

await ensureAdmin().catch((error: unknown) => {
  app.log.error(error);
});
await installMenu().catch((error: unknown) => {
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
